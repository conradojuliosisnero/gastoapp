import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { saveBudgets } from "@/app/(app)/gastos/actions";

export const metadata = { title: "Presupuestos" };

const group = new Intl.NumberFormat("es-CO");

export default async function PresupuestoPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase, "gastos");

  return (
    <form action={saveBudgets} className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/gastos" className="flex min-h-11 items-center text-[17px] text-accent">Cancelar</Link>
        <h1 className="text-[17px] font-semibold">Presupuestos</h1>
        <button type="submit" className="flex min-h-11 items-center justify-end text-[17px] font-semibold text-accent">Guardar</button>
      </div>
      <p className="px-1 text-[15px] text-muted">Cuánto quieres gastar al mes en cada categoría. Déjalo vacío si no quieres límite.</p>
      <div className="overflow-hidden rounded-2xl bg-card">
        {categories.map((c) => (
          <label key={c.id} className="flex min-h-12 items-center gap-3 border-t border-line px-4 first:border-t-0">
            <span className="flex-1 text-base">{c.name}</span>
            <input
              name={`budget:${c.id}`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Sin límite"
              defaultValue={c.budget ? `$${group.format(c.budget)}` : ""}
              className="w-36 bg-transparent text-right text-base outline-none"
            />
          </label>
        ))}
      </div>
    </form>
  );
}
