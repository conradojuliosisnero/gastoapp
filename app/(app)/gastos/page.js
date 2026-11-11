import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { summarize } from "@/lib/gastos";
import { formatCOP, monthRange } from "@/lib/money";
import { copyFixedFromPreviousMonth } from "./actions";
import Movements from "./movements";

export const metadata = { title: "Gastos" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default async function GastosPage({ searchParams }) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const month = monthRange(mes);

  const [categories, current, previousFixed] = await Promise.all([
    getCategories(supabase, "gastos"),
    supabase
      .from("transactions")
      .select("id, category_id, occurred_on, amount_enc, description_enc, kind")
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
  }));
  const summary = summarize(categories, movements);
  const hasFixed = movements.some((m) => m.kind === "fijo");
  const pct = summary.budget ? Math.min(100, Math.round((summary.total / summary.budget) * 100)) : 0;
  const over = summary.budget > 0 && summary.total > summary.budget;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 px-1">
        <h1 className="text-[34px] font-bold tracking-tight">Gastos</h1>
        <nav aria-label="Mes" className="flex items-center justify-between">
          <Link href={`/gastos?mes=${month.prev}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center text-accent">
            <Chevron d="m15 6-6 6 6 6" />
          </Link>
          <span className="text-[17px] font-semibold">{month.label}</span>
          <Link href={`/gastos?mes=${month.next}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center text-accent">
            <Chevron d="m9 6 6 6-6 6" />
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-3 rounded-[22px] bg-card p-5">
        <span className="text-[15px] text-muted">Gastado en el mes</span>
        <span className="text-[36px] font-bold tracking-tight">{formatCOP(summary.total)}</span>
        {summary.budget > 0 ? (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className={`h-2 rounded-full ${over ? "bg-warn" : "bg-accent"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[13px] text-muted">
              <span>Presupuesto {formatCOP(summary.budget)}</span>
              <span className={over ? "font-semibold text-warn" : ""}>
                {over ? `Te pasaste ${formatCOP(summary.total - summary.budget)}` : `Quedan ${formatCOP(summary.budget - summary.total)}`}
              </span>
            </div>
          </>
        ) : (
          <Link href="/gastos/presupuesto" className="text-[15px] text-accent">Definir presupuestos</Link>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-xl font-bold tracking-tight">Por categoría</h2>
          <Link href="/gastos/presupuesto" className="flex min-h-11 items-center text-[15px] text-accent">Ajustar</Link>
        </div>
        <ul className="overflow-hidden rounded-2xl bg-card">
          {summary.rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-medium">{c.name}</span>
                <span className={`text-sm font-semibold ${c.over ? "text-warn" : ""}`}>
                  {formatCOP(c.spent)}
                  {c.budget != null && <span className="font-normal text-muted"> / {formatCOP(c.budget)}</span>}
                </span>
              </div>
              {c.budget != null && (
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={`h-1.5 rounded-full ${c.over ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.min(100, Math.round((c.spent / c.budget) * 100))}%` }} />
                </div>
              )}
              {c.over && <span className="text-xs font-semibold text-warn">Excedido por {formatCOP(c.spent - c.budget)}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xl font-bold tracking-tight">Movimientos</h2>
        {!hasFixed && previousFixed.count > 0 && (
          <form action={copyFixedFromPreviousMonth} className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
            <input type="hidden" name="mes" value={month.key} />
            <span className="text-[15px] text-muted">El mes pasado tuviste {previousFixed.count} gastos fijos.</span>
            <button type="submit" className="min-h-9 shrink-0 rounded-full bg-accent px-4 text-sm font-semibold text-white">Copiarlos</button>
          </form>
        )}
        <Movements movements={movements} />
      </section>
    </div>
  );
}
