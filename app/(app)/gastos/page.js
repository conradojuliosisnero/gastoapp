import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { getCardNames } from "@/lib/card-names";
import { isUpcoming, summarize } from "@/lib/gastos";
import { formatCOP, monthRange, today } from "@/lib/money";
import Movements, { CopyFixedButton } from "./movements";
import CategoriesSheet from "./categories-sheet";
import CountUp from "@/app/count-up";
import Progress from "@/app/progress";

export const metadata = { title: "Gastos" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const UpcomingIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

export default async function GastosPage({ searchParams }) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const month = monthRange(mes);
  const todayDate = today();

  const [categories, current, previousFixed, cardNames] = await Promise.all([
    getCategories(supabase, "gastos"),
    supabase
      .from("transactions")
      .select("id, category_id, occurred_on, amount_enc, description_enc, kind, card_id, installments")
      .eq("module", "gastos")
      .gte("occurred_on", month.start)
      .lt("occurred_on", month.end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("module", "gastos")
      .eq("kind", "fijo")
      .gte("occurred_on", monthRange(month.prev).start)
      .lt("occurred_on", month.start),
    getCardNames(supabase),
  ]);
  if (current.error) throw current.error;

  const names = new Map(categories.map((c) => [c.id, c.name]));
  const movements = current.data.map((t) => ({
    id: t.id,
    categoryId: t.category_id,
    category: names.get(t.category_id) ?? "Sin categoría",
    date: t.occurred_on,
    kind: t.kind,
    amount: Number(decrypt(t.amount_enc)),
    description: t.description_enc ? decrypt(t.description_enc) : null,
    credit: t.card_id ? `${cardNames.get(t.card_id) ?? "Tarjeta"} · ${t.installments > 1 ? `${t.installments} cuotas` : "1 cuota"}` : null,
    upcoming: isUpcoming(t.occurred_on, todayDate),
  }));
  const summary = summarize(categories, movements, todayDate);
  const hasFixed = movements.some((m) => m.kind === "fijo");
  const pct = summary.budget ? Math.min(100, Math.round((summary.total / summary.budget) * 100)) : 0;
  const over = summary.budget > 0 && summary.total > summary.budget;

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-6">
      <header className="flex flex-col gap-1 px-1 lg:col-span-2">
        <h1 className="sr-only">Gastos</h1>
        <nav aria-label="Mes" className="flex items-center justify-between">
          <Link href={`/gastos?mes=${month.prev}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
            <Chevron d="m15 6-6 6 6 6" />
          </Link>
          <span className="text-[17px] font-semibold">{month.label}</span>
          <Link href={`/gastos?mes=${month.next}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
            <Chevron d="m9 6 6 6-6 6" />
          </Link>
        </nav>
      </header>

      <div className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
        <span className="text-[15px] text-muted">Gastado en el mes</span>
        <CountUp value={summary.total} className="text-[36px] font-bold tracking-tight tabular-nums" />
        {summary.budget > 0 ? (
          <>
            <Progress pct={pct} className={over ? "bg-warn" : "bg-accent"} />
            <div className="flex justify-between text-[13px] text-muted">
              <span>Presupuesto {formatCOP(summary.budget)}</span>
              <span className={over ? "font-semibold text-warn" : ""}>
                {over ? `Te pasaste ${formatCOP(summary.total - summary.budget)}` : `Quedan ${formatCOP(summary.budget - summary.total)}`}
              </span>
            </div>
          </>
        ) : (
          <Link href="/gastos/presupuesto" className="flex min-h-11 items-center text-[15px] font-semibold text-accent">Definir presupuestos →</Link>
        )}
        {summary.upcomingCount > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[15px]">
            <span className="flex items-center gap-2">
              <UpcomingIcon />
              Pagos futuros ({summary.upcomingCount})
            </span>
            <span className="font-semibold tabular-nums text-accent">{formatCOP(summary.upcoming)}</span>
          </div>
        )}
      </section>

      <CategoriesSheet rows={summary.rows} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xl font-bold tracking-tight">Movimientos</h2>
        {!hasFixed && previousFixed.count > 0 && <CopyFixedButton mes={month.key} count={previousFixed.count} />}
        <Movements movements={movements} />
      </section>
    </div>
  );
}
