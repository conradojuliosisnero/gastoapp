"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, saveBudgets } from "@/app/(app)/gastos/actions";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function BudgetForm({ categories: initialCategories }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [busy, startBusy] = useTransition();
  const [confirm, confirmDialog] = useConfirm();
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

  function add() {
    startBusy(async () => {
      const result = await createCategory(newName);
      if (result.error) return toast(result.error, "error");
      setCategories((list) => [...list, { ...result.category, budget: null }]);
      setNewName("");
      toast(`Categoría "${result.category.name}" creada`);
    });
  }

  async function remove(c) {
    const ok = await confirm({
      title: `¿Borrar "${c.name}"?`,
      message: "Sus gastos se conservan y quedan como “Sin categoría”.",
      confirmLabel: "Borrar",
      destructive: true,
    });
    if (!ok) return;
    startBusy(async () => {
      const result = await deleteCategory(c.id);
      if (result.error) return toast(result.error, "error");
      setCategories((list) => list.filter((x) => x.id !== c.id));
      toast(`Categoría "${c.name}" borrada`);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {confirmDialog}
      <SheetHeader title="Categorías" cancelHref="/gastos" />
      <p className="px-1 text-[15px] text-muted">Cuánto quieres gastar al mes en cada categoría. Déjalo vacío si no quieres límite.</p>

      <div className="overflow-hidden rounded-2xl bg-card">
        {categories.map((c) => (
          <div key={c.id} className="flex min-h-12 items-center gap-2 border-t border-line pr-1 pl-4 first:border-t-0">
            <label htmlFor={`budget-${c.id}`} className="flex-1 text-base">{c.name}</label>
            <input
              id={`budget-${c.id}`}
              name={`budget:${c.id}`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Sin límite"
              defaultValue={c.budget ? `$${group.format(c.budget)}` : ""}
              className="w-32 bg-transparent text-right text-base outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => remove(c)}
              disabled={busy}
              aria-label={`Borrar categoría ${c.name}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-danger transition active:scale-90 active:bg-danger/10"
            >
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-card p-2 pl-4">
        <input
          aria-label="Nombre de la nueva categoría"
          maxLength={40}
          placeholder="Nueva categoría (ej. Mascotas)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !newName.trim()}
          className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
        >
          {busy && <Spinner />}
          Agregar
        </button>
      </div>

      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar presupuestos" />
    </form>
  );
}
