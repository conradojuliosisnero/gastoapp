import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { summarize } from "@/lib/gastos";
import { formatCOP, monthRange, today } from "@/lib/money";

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

  const [soon, categories, monthTx] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, occurred_on, amount_enc, description_enc")
      .gt("occurred_on", todayDate)
      .lte("occurred_on", addDays(todayDate, UPCOMING_DAYS))
      .order("occurred_on"),
    getCategories(supabase, "gastos"),
    supabase.from("transactions").select("category_id, occurred_on, amount_enc").eq("module", "gastos").gte("occurred_on", month.start).lt("occurred_on", month.end),
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
  return alerts;
}
