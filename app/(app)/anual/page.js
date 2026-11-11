import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { getUsdRate } from "@/lib/fx";
import { isUpcoming } from "@/lib/gastos";
import { selectAll } from "@/lib/select-all";
import { compare, totals } from "@/lib/subscriptions";
import { formatCOP, formatMoney, today, usdToCop } from "@/lib/money";
import CountUp from "@/app/count-up";
import Progress from "@/app/progress";
import MonthBars from "../juegos/month-bars";

export const metadata = { title: "Resumen del año" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const monthShort = (m) => new Intl.DateTimeFormat("es-CO", { month: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m, 1)));

export default async function AnualPage({ searchParams }) {
  const { anio } = await searchParams;
  const todayDate = today();
  const thisYear = Number(todayDate.slice(0, 4));
  const year = /^\d{4}$/.test(anio ?? "") ? Number(anio) : thisYear;
  const supabase = await createClient();

  const [rows, gastosCats, juegosCats, subsRes, rate] = await Promise.all([
    selectAll(() => supabase.from("transactions").select("occurred_on, amount_enc, module, category_id").gte("occurred_on", `${year}-01-01`).lt("occurred_on", `${year + 1}-01-01`)),
    getCategories(supabase, "gastos"),
    getCategories(supabase, "juegos"),
    supabase.from("subscriptions").select("id, name_enc, currency, monthly_enc, annual_enc, billing").order("created_at"),
    getUsdRate(),
  ]);
  if (subsRes.error) throw subsRes.error;

  // Spending counts on the purchase day (card purchases included), like the Gastos screen; future-dated ones wait.
  const txs = rows
    .filter((t) => !isUpcoming(t.occurred_on, todayDate))
    .map((t) => ({ month: Number(t.occurred_on.slice(5, 7)) - 1, amount: Number(decrypt(t.amount_enc)), module: t.module, categoryId: t.category_id }));
  const total = txs.reduce((s, t) => s + t.amount, 0);
  const monthsElapsed = year < thisYear ? 12 : year > thisYear ? 0 : Number(todayDate.slice(5, 7));
  const average = monthsElapsed ? Math.round(total / monthsElapsed) : 0;
  const byMonth = Array.from({ length: 12 }, (_, m) => txs.filter((t) => t.month === m).reduce((s, t) => s + t.amount, 0));
  const bars = byMonth.map((t, m) => ({ period: `${year}-${m}`, label: monthShort(m).toUpperCase(), total: t, text: formatCOP(t), over: false }));

  const names = new Map(gastosCats.map((c) => [c.id, c.name]));
  const catTotals = new Map();
  for (const t of txs) {
    const key = t.module === "juegos" ? "Videojuegos" : (names.get(t.categoryId) ?? "Sin categoría");
    catTotals.set(key, (catTotals.get(key) ?? 0) + t.amount);
  }
  const categories = [...catTotals].map(([name, amount]) => ({ name, amount })).toSorted((a, b) => b.amount - a.amount);
  const gameSubsCat = juegosCats.find((c) => c.name === "Suscripción");
  const gameSubsSpent = gameSubsCat ? txs.filter((t) => t.categoryId === gameSubsCat.id).reduce((s, t) => s + t.amount, 0) : 0;

  const subs = subsRes.data.map((s) => ({
    id: s.id,
    name: decrypt(s.name_enc),
    currency: s.currency,
    monthly: s.monthly_enc ? Number(decrypt(s.monthly_enc)) : null,
    annual: s.annual_enc ? Number(decrypt(s.annual_enc)) : null,
    billing: s.billing,
  }));
  const missingRate = !rate && subs.some((s) => s.currency === "USD");
  const toCop = (n, currency) => (currency === "USD" ? (rate ? usdToCop(n, rate) : 0) : n);
  const subTotals = totals(subs, toCop);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <h1 className="sr-only">Resumen del año</h1>
      <nav aria-label="Año" className="flex items-center justify-between px-1 lg:col-span-2">
        <Link href={`/anual?anio=${year - 1}`} aria-label="Año anterior" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m15 6-6 6 6 6" />
        </Link>
        <span className="text-[17px] font-semibold">{year}</span>
        <Link href={`/anual?anio=${year + 1}`} aria-label="Año siguiente" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m9 6 6 6-6 6" />
        </Link>
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] text-muted">Gastado en {year}</span>
            <CountUp value={total} className="font-display text-[36px] font-semibold tracking-tight tabular-nums" />
            <span className="text-[13px] text-muted">
              {monthsElapsed ? `Promedio ${formatCOP(average)} al mes` : "Este año aún no empieza"} · gastos, juegos y compras con tarjeta
            </span>
          </div>
          <MonthBars bars={bars} limit={null} label={`Gasto por mes en ${year}`} />
        </section>

        <section aria-labelledby="donde" className="flex flex-col gap-2">
          <h2 id="donde" className="px-1 font-display text-xl font-semibold tracking-tight">En qué se va</h2>
          {categories.length === 0 ? (
            <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">Sin gastos registrados en {year}.</p>
          ) : (
            <ul data-stagger className="overflow-hidden rounded-2xl bg-card">
              {categories.slice(0, 8).map((c) => (
                <li key={c.name} className="flex flex-col gap-1.5 border-t border-line px-4 py-3 first:border-t-0">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-base font-medium">{c.name}</span>
                    <span className="text-base font-semibold tabular-nums">{formatCOP(c.amount)}</span>
                  </span>
                  <Progress pct={(c.amount / total) * 100} label={`${c.name}: ${Math.round((c.amount / total) * 100)}% del año`} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="suscripciones" className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="suscripciones" className="font-display text-xl font-semibold tracking-tight">Suscripciones</h2>
            <Link href="/suscripcion" aria-label="Agregar suscripción" className="flex min-h-9 items-center gap-1 rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Agregar
            </Link>
          </div>

          {subs.length === 0 ? (
            <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">
              Agrega tus suscripciones (streaming, PlayStation Plus, apps…) con el precio mensual y el del plan anual, y te digo cuánto te cuestan al año y si te conviene pagar los 12 meses.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5">
                  <span className="text-[13px] text-muted">Al año</span>
                  <CountUp value={subTotals.year} className="font-display text-xl font-semibold tabular-nums" />
                  <span className="text-[12px] text-muted tabular-nums">≈ {formatCOP(subTotals.month)} al mes</span>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5">
                  <span className="text-[13px] text-muted">Podrías ahorrar</span>
                  <CountUp value={subTotals.potential} className={`text-xl font-bold tabular-nums ${subTotals.potential ? "text-ok" : ""}`} />
                  <span className="text-[12px] text-muted">{subTotals.potential ? "cambiando de plan" : "ya pagas lo mejor"}</span>
                </div>
              </div>
              <ul data-stagger className="overflow-hidden rounded-2xl bg-card">
                {subs.map((s) => {
                  const c = compare(s);
                  const switchTo = c.best && c.best !== s.billing ? c.best : null;
                  return (
                    <li key={s.id} className="border-t border-line first:border-t-0">
                      <Link href={`/suscripcion?id=${s.id}`} aria-label={`Editar ${s.name}`} className="flex items-center gap-3 px-4 py-3 transition active:bg-fill lg:hover:bg-fill">
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-base font-medium">{s.name}</span>
                          <span className="text-[13px] text-muted tabular-nums">
                            {s.billing === "anual" ? "Pago anual" : `${formatMoney(s.monthly, s.currency)} al mes`}
                            {s.currency === "USD" && rate ? ` · ≈ ${formatCOP(toCop(c.yearCost, "USD"))} al año` : ""}
                          </span>
                          {switchTo ? (
                            <span className="text-[13px] font-semibold text-ok">
                              {switchTo === "anual" ? "Conviene el plan anual" : "Conviene pagar mensual"}: ahorras {formatMoney(c.saving, s.currency)} ({c.pct}%)
                            </span>
                          ) : c.best ? (
                            <span className="text-[13px] text-muted">Ya pagas el plan que más conviene</span>
                          ) : null}
                        </span>
                        <span className="flex flex-col items-end">
                          <span className="text-base font-semibold tabular-nums">{formatMoney(c.yearCost, s.currency)}</span>
                          <span className="text-[12px] text-muted">al año</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {missingRate && <p className="px-1 text-[13px] text-warn">No pudimos traer la tasa del dólar; las suscripciones en USD no suman en pesos por ahora.</p>}
            </>
          )}
          {gameSubsSpent > 0 && (
            <p className="px-1 text-[13px] text-muted">
              En {year} registraste {formatCOP(gameSubsSpent)} en compras de juegos tipo “Suscripción”.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
