import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { computeSavings } from "@/lib/ahorro";
import { formatCOP, maskCOP, monthRange, today } from "@/lib/money";
import { isUpcoming } from "@/lib/gastos";
import InstallCard from "@/app/install-card";
import { SalaryValue, SavingsBars } from "./savings-widgets";

export const metadata = { title: "Inicio" };

const PAGE = 1000; // Supabase's default max rows per request.

async function selectAll(makeQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await makeQuery().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

const shortMonth = (period) => new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(new Date(`${period}-01T00:00:00Z`)).replace(".", "");

export default async function InicioPage() {
  const supabase = await createClient();
  const month = monthRange();

  const [{ data: claims }, incomeRows] = await Promise.all([
    supabase.auth.getClaims(),
    selectAll(() => supabase.from("incomes").select("period, amount_enc").order("period")),
  ]);
  const incomes = incomeRows.map((r) => ({ period: r.period, amount: Number(decrypt(r.amount_enc)) }));

  // shortcut: decrypts every expense since the first salary to add them up; store monthly totals if history grows into the tens of thousands.
  const expenseRows = incomes.length
    ? await selectAll(() => supabase.from("transactions").select("occurred_on, amount_enc").gte("occurred_on", `${incomes[0].period}-01`).lt("occurred_on", month.end))
    : [];
  const todayDate = today();
  const expenses = expenseRows.map((r) => ({ date: r.occurred_on, amount: Number(decrypt(r.amount_enc)) }));
  // Future-dated payments don't reduce savings until their day comes.
  const savings = computeSavings({ incomes, expenses: expenses.filter((e) => !isUpcoming(e.date, todayDate)), currentPeriod: month.key });
  const upcoming = expenses.filter((e) => isUpcoming(e.date, todayDate)).reduce((sum, e) => sum + e.amount, 0);
  const current = savings.current;
  const spentPct = current?.income ? Math.min(100, Math.round((current.spent / current.income) * 100)) : 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between px-1">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-muted">{claims?.claims?.email}</p>
          <h1 className="text-[34px] font-bold tracking-tight">Resumen</h1>
        </div>
        <Link href="/ajustes" aria-label="Ajustes" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-ink-2 transition active:scale-90">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </header>

      <InstallCard />

      {!current ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
          <h2 className="text-xl font-bold tracking-tight">Empieza tu ahorro</h2>
          <p className="text-[15px] text-muted">Agrega tu sueldo mensual y verás cuánto te queda cada mes después de tus gastos, y cuánto llevas ahorrado.</p>
          <Link href="/ahorro/sueldo" className="flex min-h-[52px] items-center justify-center rounded-2xl bg-primary text-[17px] font-semibold text-white transition active:scale-[0.98]">
            Agregar mi sueldo
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="mes-actual" className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 id="mes-actual" className="text-[15px] text-muted">{month.label}</h2>
              <Link href="/ahorro/sueldo" className="flex min-h-9 items-center rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
                Cambiar sueldo
              </Link>
            </div>
            <div className="flex items-center justify-between text-base">
              <span>Sueldo</span>
              <SalaryValue masked={maskCOP(current.income)} />
            </div>
            <div className="flex items-center justify-between text-base">
              <span>Gastado</span>
              <span className="font-semibold tabular-nums">{formatCOP(current.spent)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className={`h-2 rounded-full ${current.saved < 0 ? "bg-warn" : "bg-accent"}`} style={{ width: `${spentPct}%` }} />
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-base font-semibold">Ahorro del mes</span>
              <span className={`text-2xl font-bold tabular-nums ${current.saved < 0 ? "text-warn" : "text-ok"}`}>{formatCOP(current.saved)}</span>
            </div>
            {upcoming > 0 && (
              <p className="flex items-center justify-between gap-3 text-[13px] text-muted">
                <span>Pagos futuros este mes: −{formatCOP(upcoming)}</span>
                <span>
                  Quedaría <b className={`font-semibold ${current.saved - upcoming < 0 ? "text-warn" : "text-ink"}`}>{formatCOP(current.saved - upcoming)}</b>
                </span>
              </p>
            )}
          </section>

          <section aria-labelledby="acumulado" className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
            <div className="flex flex-col gap-0.5">
              <h2 id="acumulado" className="text-[15px] text-muted">Ahorro acumulado</h2>
              <span className={`text-[36px] font-bold tracking-tight tabular-nums ${savings.total < 0 ? "text-warn" : ""}`}>{formatCOP(savings.total)}</span>
              <span className="text-[13px] text-muted">Desde {monthRange(savings.months[0].period).label.toLowerCase()} · incluye lo que llevas de este mes</span>
            </div>
            <SavingsBars
              months={savings.months.slice(-6).map((m) => ({ period: m.period, saved: m.saved, label: shortMonth(m.period), text: formatCOP(m.saved) }))}
            />
          </section>
        </>
      )}
    </div>
  );
}
