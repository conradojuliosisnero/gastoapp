import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dueDate } from "@/lib/internet";
import { formatCOP, monthRange, today } from "@/lib/money";
import { getPlan } from "./data";
import Members from "./members";
import CountUp from "@/app/count-up";
import Progress from "@/app/progress";

export const metadata = { title: "Internet" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const dayMonth = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

function lastPeriods(key, n) {
  const out = [];
  let m = monthRange(key);
  for (let i = 0; i < n; i++) {
    out.push(m);
    m = monthRange(m.prev);
  }
  return out;
}

export default async function InternetPage({ searchParams }) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const month = monthRange(mes);
  const plan = await getPlan(supabase);

  if (!plan) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="sr-only">Internet compartido</h1>
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
          <h2 className="font-display text-xl font-semibold tracking-tight">Internet compartido</h2>
          <p className="text-[15px] text-muted">Registra tu plan, con quién lo compartes y cuánto pone cada uno. Luego marcas quién ya pagó cada mes.</p>
          <Link href="/internet/plan" className="flex min-h-[52px] items-center justify-center rounded-2xl bg-primary text-[17px] font-semibold text-white transition active:scale-[0.98]">
            Configurar plan
          </Link>
        </section>
      </div>
    );
  }

  const history = lastPeriods(month.key, 6);
  const { data: payments, error } = await supabase
    .from("internet_payments")
    .select("member_id, period")
    .in("member_id", plan.members.map((m) => m.id))
    .in("period", history.map((h) => h.key));
  if (error) throw error;

  const paidThisMonth = new Set(payments.filter((p) => p.period === month.key).map((p) => p.member_id));
  const collected = plan.members.filter((m) => paidThisMonth.has(m.id)).reduce((s, m) => s + m.share, 0);
  const due = dueDate(month.key, plan.dueDay);
  const overdue = today() > due && paidThisMonth.size < plan.members.length;
  const pct = Math.round((collected / plan.amount) * 100);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <h1 className="sr-only">Internet compartido</h1>
      <nav aria-label="Mes" className="flex items-center justify-between px-1 lg:col-span-2">
        <Link href={`/internet?mes=${month.prev}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m15 6-6 6 6 6" />
        </Link>
        <span className="text-[17px] font-semibold">{month.label}</span>
        <Link href={`/internet?mes=${month.next}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m9 6 6 6-6 6" />
        </Link>
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[15px] text-muted">{plan.name}</span>
            <CountUp value={plan.amount} className="font-display text-[36px] font-semibold tracking-tight tabular-nums" />
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${overdue ? "bg-warn/15 text-warn" : "bg-accent/12 text-accent"}`}>
            {overdue ? "Venció" : "Vence"} {dayMonth.format(new Date(`${due}T00:00:00Z`))}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] text-muted">
            <span>Recaudado {formatCOP(collected)} de {formatCOP(plan.amount)}</span>
            <span>
              {paidThisMonth.size} de {plan.members.length} pagaron
            </span>
          </div>
          <Progress pct={pct} className="bg-ok" />
        </div>
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span>{plan.splitMode === "equal" ? `Partes iguales · ${plan.members.length} personas` : `Partes personalizadas · ${plan.members.length} personas`}</span>
          <Link href="/internet/plan" className="flex min-h-9 items-center rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
            Editar plan
          </Link>
        </div>
        {plan.splitMode === "custom" && plan.members.reduce((s, m) => s + m.share, 0) !== plan.amount && (
          <p role="status" className="rounded-xl bg-warn/10 px-3 py-2 text-[13px] font-medium text-warn">
            Las partes suman {formatCOP(plan.members.reduce((s, m) => s + m.share, 0))} y el plan cuesta {formatCOP(plan.amount)}. Ajústalas en Editar plan.
          </p>
        )}
      </section>

      <Members period={month.key} members={plan.members.map((m) => ({ ...m, paid: paidThisMonth.has(m.id) }))} canAdd={plan.members.length < 12} />

      </div>

      <section aria-labelledby="historial" className="flex flex-col gap-2">
        <h2 id="historial" className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Historial</h2>
        <ul data-stagger className="overflow-hidden rounded-2xl bg-card">
          {history.slice(1).map((h) => {
            const count = payments.filter((p) => p.period === h.key).length;
            const complete = count === plan.members.length;
            return (
              <li key={h.key} className="border-t border-line first:border-t-0">
                <Link href={`/internet?mes=${h.key}`} className="flex min-h-12 items-center justify-between px-4 active:bg-fill">
                  <span className="text-base">{h.label}</span>
                  <span className={`text-[14px] font-semibold ${complete ? "text-ok" : count ? "text-warn" : "text-muted"}`}>
                    {complete ? "Completo" : `${count} de ${plan.members.length}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
