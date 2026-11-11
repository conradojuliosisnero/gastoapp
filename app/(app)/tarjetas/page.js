import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCredit } from "@/lib/cards";
import { formatCOP, monthRange, today } from "@/lib/money";
import { dayIn } from "@/lib/credit";
import CountUp from "@/app/count-up";
import Progress from "@/app/progress";

export const metadata = { title: "Tarjetas" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const TILE = ["from-[#1d3b8f] to-[#0a66d8]", "from-[#3a3a3c] to-[#1c1c1e]", "from-[#7a1f5c] to-[#c2367b]", "from-[#0f6b55] to-[#1f9d6e]", "from-[#8a4b0a] to-[#d07a17]"];
const dayMonth = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtDate = (d) => dayMonth.format(new Date(`${d}T00:00:00Z`)).replace(".", "");

export default async function TarjetasPage({ searchParams }) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const month = monthRange(mes);
  const todayDate = today();
  const { cards, purchases, cuotas } = await getCredit(supabase);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="sr-only">Tarjetas de crédito</h1>
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5 lg:max-w-xl">
          <h2 className="text-xl font-bold tracking-tight">Tarjetas de crédito</h2>
          <p className="text-[15px] text-muted">
            Agrega tus tarjetas con su día de corte y de pago. Cuando registres un gasto con tarjeta y en cuotas, aquí verás cuánto pagas cada mes y cuánto debes.
          </p>
          <Link href="/tarjetas/tarjeta" className="flex min-h-[52px] items-center justify-center rounded-2xl bg-primary text-[17px] font-semibold text-white transition active:scale-[0.98]">
            Agregar tarjeta
          </Link>
          <p className="text-[13px] text-muted">Solo guardamos un nombre y las fechas, nunca datos de la tarjeta.</p>
        </section>
      </div>
    );
  }

  const due = cuotas.filter((c) => c.date >= month.start && c.date < month.end).toSorted((a, b) => a.date.localeCompare(b.date));
  const dueTotal = due.reduce((s, c) => s + c.amount, 0);
  const pending = cuotas.filter((c) => c.date >= todayDate);
  const debt = pending.reduce((s, c) => s + c.amount, 0);
  const names = new Map(cards.map((c) => [c.id, c.name]));

  const perCard = cards.map((card, i) => ({
    ...card,
    tile: TILE[i % TILE.length],
    due: due.filter((c) => c.cardId === card.id).reduce((s, c) => s + c.amount, 0),
    payOn: dayIn(month.key, card.payDay),
  }));

  const active = purchases
    .map((p) => {
      const mine = cuotas.filter((c) => c.purchaseId === p.id);
      const paid = mine.filter((c) => c.date < todayDate);
      return { ...p, of: mine.length, paidCount: paid.length, left: mine.reduce((s, c) => s + c.amount, 0) - paid.reduce((s, c) => s + c.amount, 0) };
    })
    .filter((p) => p.left > 0 && p.of > 1)
    .toReversed();

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <h1 className="sr-only">Tarjetas de crédito</h1>
      <nav aria-label="Mes" className="flex items-center justify-between px-1 lg:col-span-2">
        <Link href={`/tarjetas?mes=${month.prev}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m15 6-6 6 6 6" />
        </Link>
        <span className="text-[17px] font-semibold">{month.label}</span>
        <Link href={`/tarjetas?mes=${month.next}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m9 6 6 6-6 6" />
        </Link>
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
          <span className="text-[15px] text-muted">A pagar en {month.label.split(" ")[0].toLowerCase()}</span>
          <CountUp value={dueTotal} className="text-[36px] font-bold tracking-tight tabular-nums" />
          <div className="flex items-center justify-between border-t border-line pt-3 text-[15px]">
            <span>Deuda pendiente</span>
            <span className="font-semibold tabular-nums">{formatCOP(debt)}</span>
          </div>
          <p className="text-[13px] text-muted">
            {pending.length} {pending.length === 1 ? "cuota por pagar" : "cuotas por pagar"} desde hoy. Las cuotas se calculan en partes iguales, sin intereses.
          </p>
        </section>

        <section aria-labelledby="mis-tarjetas" className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="mis-tarjetas" className="text-xl font-bold tracking-tight">Tus tarjetas</h2>
            <Link href="/tarjetas/tarjeta" aria-label="Agregar tarjeta" className="flex min-h-9 items-center gap-1 rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Agregar
            </Link>
          </div>
          <ul data-stagger className="flex flex-col gap-2.5">
            {perCard.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/tarjetas/tarjeta?id=${c.id}`}
                  aria-label={`Editar ${c.name}`}
                  className={`flex min-h-[108px] flex-col justify-between rounded-[18px] bg-gradient-to-br ${c.tile} p-4 text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition active:scale-[0.98] lg:hover:-translate-y-0.5`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate text-[17px] font-semibold">{c.name}</span>
                    <svg aria-hidden="true" width="30" height="22" viewBox="0 0 30 22" className="shrink-0 opacity-80"><rect x="0.5" y="0.5" width="29" height="21" rx="4" fill="none" stroke="currentColor" /><path d="M0.5 7h29" stroke="currentColor" /></svg>
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="text-[13px] text-white/80">
                      Corte día {c.cutDay}
                      <br />
                      Pagas el {fmtDate(c.payOn)}
                    </span>
                    <span className="text-right">
                      <span className="block text-[12px] text-white/75">Este mes</span>
                      <span className="text-xl font-bold tabular-nums">{formatCOP(c.due)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="cuotas-mes" className="flex flex-col gap-2">
          <h2 id="cuotas-mes" className="px-1 text-xl font-bold tracking-tight">Cuotas del mes</h2>
          {due.length === 0 ? (
            <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">
              Nada que pagar este mes. Para registrar una compra a crédito, toca + y elige la tarjeta en “Medio de pago”.
            </p>
          ) : (
            <ul data-stagger className="overflow-hidden rounded-2xl bg-card">
              {due.map((c) => (
                <li key={`${c.purchaseId}-${c.n}`} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base font-medium">{c.title || "Compra con tarjeta"}</span>
                    <span className="text-[13px] text-muted">
                      {names.get(c.cardId)} · {c.of > 1 ? `Cuota ${c.n} de ${c.of}` : "1 cuota"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="text-base font-semibold tabular-nums">{formatCOP(c.amount)}</span>
                    <span className={`text-[12px] font-semibold ${c.date < todayDate ? "text-muted" : "text-accent"}`}>
                      {c.date < todayDate ? `Venció ${fmtDate(c.date)}` : `Vence ${fmtDate(c.date)}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {active.length > 0 && (
          <section aria-labelledby="en-cuotas" className="flex flex-col gap-2">
            <h2 id="en-cuotas" className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Compras en cuotas</h2>
            <ul data-stagger className="overflow-hidden rounded-2xl bg-card">
              {active.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-base font-medium">{p.title || "Compra con tarjeta"}</span>
                    <span className="shrink-0 text-[13px] text-muted tabular-nums">de {formatCOP(p.amount)}</span>
                  </span>
                  <Progress pct={(p.paidCount / p.of) * 100} className="bg-ok" label={`${p.paidCount} de ${p.of} cuotas pagadas`} />
                  <span className="flex justify-between text-[13px] text-muted">
                    <span>
                      {names.get(p.cardId)} · {p.paidCount} de {p.of} pagadas
                    </span>
                    <span className="font-semibold text-ink tabular-nums">Faltan {formatCOP(p.left)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
