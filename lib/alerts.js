import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { summarize } from "@/lib/gastos";
import { formatCOP, monthRange, today } from "@/lib/money";
import { dueDate } from "@/lib/internet";
import { getPlan } from "@/app/(app)/internet/data";

const UPCOMING_DAYS = 7;
const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// In-app alerts shown under the bell: payments due soon and budgets already exceeded this month.
export async function getAlerts(supabase) {
  const todayDate = today();
  const month = monthRange();

  const [soon, categories, monthTx, plan] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, occurred_on, amount_enc, description_enc")
      .gt("occurred_on", todayDate)
      .lte("occurred_on", addDays(todayDate, UPCOMING_DAYS))
      .order("occurred_on"),
    getCategories(supabase, "gastos"),
    supabase.from("transactions").select("category_id, occurred_on, amount_enc").eq("module", "gastos").gte("occurred_on", month.start).lt("occurred_on", month.end),
    getPlan(supabase),
  ]);
  if (soon.error) throw soon.error;
  if (monthTx.error) throw monthTx.error;

  const alerts = soon.data.map((t) => ({
    id: `pago-${t.id}`,
    kind: "pago",
    title: `Pago el ${shortDate.format(new Date(`${t.occurred_on}T00:00:00Z`))}`,
    body: `${t.description_enc ? decrypt(t.description_enc) : "Gasto programado"} · ${formatCOP(Number(decrypt(t.amount_enc)))}`,
    href: `/gastos?mes=${t.occurred_on.slice(0, 7)}`,
  }));

  const summary = summarize(
    categories,
    monthTx.data.map((t) => ({ categoryId: t.category_id, date: t.occurred_on, amount: Number(decrypt(t.amount_enc)) })),
    todayDate
  );
  for (const c of summary.rows.filter((r) => r.over)) {
    alerts.push({
      id: `presupuesto-${c.id}`,
      kind: "presupuesto",
      title: `Te pasaste en ${c.name}`,
      body: `${formatCOP(c.spent - c.budget)} sobre tu presupuesto de ${formatCOP(c.budget)}`,
      href: "/gastos",
    });
  }
  // Internet: after the due day, whoever hasn't paid this month.
  if (plan && todayDate > dueDate(month.key, plan.dueDay)) {
    const { data: paid, error } = await supabase.from("internet_payments").select("member_id").eq("period", month.key).in("member_id", plan.members.map((m) => m.id));
    if (error) throw error;
    const paidIds = new Set(paid.map((p) => p.member_id));
    for (const m of plan.members.filter((m) => !paidIds.has(m.id))) {
      alerts.push({
        id: `internet-${m.id}`,
        kind: "presupuesto",
        title: m.isMe ? "Falta tu parte del internet" : `${m.name} no ha pagado el internet`,
        body: `${formatCOP(m.share)} · venció el ${shortDate.format(new Date(`${dueDate(month.key, plan.dueDay)}T00:00:00Z`))}`,
        href: "/internet",
      });
    }
  }
  return alerts;
}
