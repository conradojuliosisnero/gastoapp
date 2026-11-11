import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { computeSavings } from "@/lib/ahorro";
import { formatCOP, maskCOP, monthRange, today } from "@/lib/money";
import { isUpcoming } from "@/lib/gastos";
import InstallCard from "@/app/install-card";
import { ExtraList, SalaryValue, SavingsBars } from "./savings-widgets";

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

  const [incomeRows] = await Promise.all([
    selectAll(() => supabase.from("incomes").select("period, amount_enc, created_at").order("period")),
  ]);
  const incomes = incomeRows.map((r) => ({ period: r.period, amount: Number(decrypt(r.amount_enc)) }));
  // Savings start the month the first salary was registered, not the "desde" month chosen for it.
  const startPeriod = incomeRows.length
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(incomeRows.map((r) => r.created_at).sort()[0])).slice(0, 7)
    : null;

  // shortcut: decrypts every expense since the first salary to add them up; store monthly totals if history grows into the tens of thousands.
  const [expenseRows, extraRows] = incomes.length
    ? await Promise.all([
        selectAll(() => supabase.from("transactions").select("occurred_on, amount_enc").gte("occurred_on", `${startPeriod}-01`).lt("occurred_on", month.end)),
        selectAll(() =>
          supabase.from("extra_incomes").select("id, received_on, amount_enc, description_enc").gte("received_on", `${startPeriod}-01`).lt("received_on", month.end).order("received_on", { ascending: false })
        ),
      ])
    : [[], []];
  const todayDate = today();
  const expenses = expenseRows.map((r) => ({ date: r.occurred_on, amount: Number(decrypt(r.amount_enc)) }));
  // Future-dated payments don't reduce savings until their day comes.
  const extras = extraRows.map((r) => ({
    id: r.id,
    date: r.received_on,
    amount: Number(decrypt(r.amount_enc)),
    description: r.description_enc ? decrypt(r.description_enc) : null,
  }));
  const savings = computeSavings({
    incomes,
    expenses: expenses.filter((e) => !isUpcoming(e.date, todayDate)),
    extras: extras.filter((e) => !isUpcoming(e.date, todayDate)),
    currentPeriod: month.key,
    startPeriod,
  });
  const monthExtras = extras.filter((e) => e.date >= month.start);
  const upcoming = expenses.filter((e) => isUpcoming(e.date, todayDate)).reduce((sum, e) => sum + e.amount, 0);
  const current = savings.current;
  const available = current ? current.income + current.extra : 0;
  const spentPct = available ? Math.min(100, Math.round((current.spent / available) * 100)) : 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">Resumen</h1>

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
              <span className="flex items-center gap-2">
                Ingresos extra
                <Link href="/ahorro/extra" aria-label="Agregar ingreso extra" className="flex size-7 items-center justify-center rounded-full bg-ok/15 text-ok transition active:scale-90">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </Link>
              </span>
              <span className="font-semibold tabular-nums text-ok">+{formatCOP(current.extra)}</span>
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

          {monthExtras.length > 0 && <ExtraList items={monthExtras} />}

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
