"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveBudgets } from "@/app/(app)/gastos/actions";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function BudgetForm({ categories }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveBudgets(prev, formData);
    if (result.ok) {
      toast("Presupuestos guardados");
      router.push("/gastos");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Presupuestos" cancelHref="/gastos" />
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
              className="w-36 bg-transparent text-right text-base outline-none placeholder:text-muted"
            />
          </label>
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar presupuestos" />
    </form>
  );
}
