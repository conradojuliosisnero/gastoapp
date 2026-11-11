import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { summarize } from "@/lib/gastos";
import { formatCOP, formatMoney, monthRange, today } from "@/lib/money";
import { dueDate } from "@/lib/internet";
import { getPlan } from "@/app/(app)/internet/data";
import { getCredit } from "@/lib/cards";
import { COLUMNS, chargeAmount, fromRow, nextRenewal } from "@/lib/subscription-store";

const UPCOMING_DAYS = 7;
const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// In-app alerts shown under the bell: payments due soon and budgets already exceeded this month.
// Pass `userId` when using the service-role client (reminders cron): RLS doesn't scope it, these filters do.
export async function getAlerts(supabase, userId = null) {
  const todayDate = today();
  const month = monthRange();
  const from = (table) => {
    const q = supabase.from(table);
    return { select: (cols) => (userId ? q.select(cols).eq("user_id", userId) : q.select(cols)) };
  };

  const [soon, categories, monthTx, plan, gamesLimit, gamesTx, credit, subs] = await Promise.all([
    from("transactions")
      .select("id, occurred_on, amount_enc, description_enc")
      .is("card_id", null)
      .gt("occurred_on", todayDate)
      .lte("occurred_on", addDays(todayDate, UPCOMING_DAYS))
      .order("occurred_on"),
    getCategories(supabase, "gastos", userId),
    from("transactions").select("category_id, occurred_on, amount_enc").eq("module", "gastos").gte("occurred_on", month.start).lt("occurred_on", month.end),
    getPlan(supabase, userId),
    from("module_limits").select("amount_enc").eq("module", "juegos").maybeSingle(),
    from("transactions").select("occurred_on, amount_enc").eq("module", "juegos").gte("occurred_on", month.start).lte("occurred_on", todayDate),
    getCredit(supabase, userId),
    from("subscriptions").select(COLUMNS),
  ]);
  if (soon.error) throw soon.error;
  if (monthTx.error) throw monthTx.error;

  const alerts = soon.data.map((t) => ({
    id: `pago-${t.id}`,
    kind: "pago",
    title: `Pago el ${shortDate.format(new Date(`${t.occurred_on}T00:00:00Z`))}`,
    body: `${t.description_enc ? decrypt(t.description_enc) : "Gasto programado"} · ${formatCOP(Number(decrypt(t.amount_enc)))}`,
    href: `/gastos?mes=${t.occurred_on.slice(0, 7)}`,
    // For the email: grouped rows with name, detail line and amount.
    group: "pagos",
    name: t.description_enc ? decrypt(t.description_enc) : "Gasto programado",
    meta: `Gasto programado · ${shortDate.format(new Date(`${t.occurred_on}T00:00:00Z`))}`,
    amount: Number(decrypt(t.amount_enc)),
  }));

  // Card bills due in the next days: one alert per card with the sum of its installments.
  for (const card of credit.cards) {
    const due = credit.cuotas.filter((c) => c.cardId === card.id && c.date >= todayDate && c.date <= addDays(todayDate, UPCOMING_DAYS));
    if (!due.length) continue;
    const date = due[0].date;
    alerts.push({
      id: `tarjeta-${card.id}-${date}`,
      kind: "pago",
      title: `Pago de ${card.name} el ${shortDate.format(new Date(`${date}T00:00:00Z`))}`,
      body: `${formatCOP(due.reduce((s, c) => s + c.amount, 0))} · ${due.length} ${due.length === 1 ? "cuota" : "cuotas"}`,
      href: `/tarjetas?mes=${date.slice(0, 7)}`,
      group: "pagos",
      name: `Tarjeta ${card.name}`,
      meta: `${due.length} ${due.length === 1 ? "cuota" : "cuotas"} · ${shortDate.format(new Date(`${date}T00:00:00Z`))}`,
      amount: due.reduce((s, c) => s + c.amount, 0),
    });
  }

  // Subscriptions renewing in the next days (same data the SubTrack extension edits).
  for (const sub of (subs.data ?? []).map(fromRow)) {
    const date = nextRenewal(sub.renewsOn, sub.billing, todayDate);
    if (!date || date > addDays(todayDate, UPCOMING_DAYS)) continue;
    const charge = chargeAmount(sub);
    const when = shortDate.format(new Date(`${date}T00:00:00Z`));
    alerts.push({
      id: `suscripcion-${sub.id}-${date}`,
      kind: "pago",
      title: `Se renueva ${sub.name} el ${when}`,
      body: [charge && formatMoney(charge, sub.currency), sub.source].filter(Boolean).join(" · ") || "Suscripción",
      href: "/anual",
      group: "pagos",
      name: sub.name,
      meta: `Renovación ${sub.billing} · ${when}`,
      amount: sub.currency === "COP" ? charge : null, // email totals are in pesos
    });
  }

  const summary = summarize(
    categories,
    monthTx.data.map((t) => ({ categoryId: t.category_id, date: t.occurred_on, amount: Number(decrypt(t.amount_enc)) })),
    todayDate
  );
  for (const c of summary.rows.filter((r) => r.over)) {
    alerts.push({
      id: `presupuesto-${c.id}-${month.key}`, // monthly: a new month's overspend is a new alert
      kind: "presupuesto",
      title: `Te pasaste en ${c.name}`,
      body: `${formatCOP(c.spent - c.budget)} sobre tu presupuesto de ${formatCOP(c.budget)}`,
      href: "/gastos",
      group: "presupuestos",
      name: c.name,
      meta: `Presupuesto ${formatCOP(c.budget)} · gastado ${formatCOP(c.spent)}`,
      amount: c.spent - c.budget,
    });
  }
  if (gamesLimit.data && !gamesTx.error) {
    const limit = Number(decrypt(gamesLimit.data.amount_enc));
    const spent = gamesTx.data.reduce((s, t) => s + Number(decrypt(t.amount_enc)), 0);
    if (spent > limit) {
      alerts.push({
        id: `juegos-limite-${month.key}`,
        kind: "presupuesto",
        title: "Te pasaste del límite de juegos",
        body: `${formatCOP(spent - limit)} sobre tu límite de ${formatCOP(limit)}`,
        href: "/juegos",
        group: "presupuestos",
        name: "Videojuegos",
        meta: `Límite ${formatCOP(limit)} · gastado ${formatCOP(spent)}`,
        amount: spent - limit,
      });
    }
  }

  // Internet: after the due day, whoever hasn't paid this month.
  if (plan && todayDate > dueDate(month.key, plan.dueDay)) {
    const { data: paid, error } = await from("internet_payments").select("member_id").eq("period", month.key).in("member_id", plan.members.map((m) => m.id));
    if (error) throw error;
    const paidIds = new Set(paid.map((p) => p.member_id));
    for (const m of plan.members.filter((m) => !paidIds.has(m.id))) {
      alerts.push({
        id: `internet-${m.id}-${month.key}`,
        kind: "presupuesto",
        title: m.isMe ? "Falta tu parte del internet" : `${m.name} no ha pagado el internet`,
        body: `${formatCOP(m.share)} · venció el ${shortDate.format(new Date(`${dueDate(month.key, plan.dueDay)}T00:00:00Z`))}`,
        href: "/internet",
        group: "internet",
        name: m.isMe ? "Tu parte" : m.name,
        meta: `Venció el ${shortDate.format(new Date(`${dueDate(month.key, plan.dueDay)}T00:00:00Z`))}`,
        amount: m.share,
      });
    }
  }
  return alerts;
}

// Marks each alert with `read`, from the ids the user already saw.
export async function withReadState(supabase, alerts) {
  if (!alerts.length) return alerts;
  const { data, error } = await supabase.from("notification_reads").select("alert_id").in("alert_id", alerts.map((a) => a.id));
  if (error) throw error;
  const read = new Set(data.map((r) => r.alert_id));
  return alerts.map((a) => ({ ...a, read: read.has(a.id) }));
}
