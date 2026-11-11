"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, createTransaction } from "@/app/(app)/gastos/actions";
import { parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function NewExpenseForm({ categories: initialCategories, defaultDate }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected] = useState(initialCategories[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, startCreating] = useTransition();

  function addCategory() {
    startCreating(async () => {
      const result = await createCategory(newName);
      if (result.error) return toast(result.error, "error");
      setCategories((list) => [...list, result.category]);
      setSelected(result.category.id);
      setNewName("");
      setAdding(false);
      toast(`Categoría "${result.category.name}" creada`);
    });
  }
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createTransaction(prev, formData);
    if (result.ok) {
      toast("Gasto guardado");
      router.push(`/gastos?mes=${result.mes}`);
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Nuevo gasto" cancelHref="/gastos" />

      <label className="flex flex-col items-center gap-1 py-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Monto (COP)</span>
        <input
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          required
          autoFocus
          placeholder="$0"
          value={amount}
          onChange={(e) => {
            const n = parseAmount(e.target.value);
            setAmount(n == null ? "" : `$${group.format(n)}`);
          }}
          className="w-full bg-transparent text-center text-[52px] font-bold tracking-tight outline-none"
        />
      </label>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input type="radio" name="categoryId" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} className="peer sr-only" />
              <span className="flex min-h-9 items-center rounded-full border border-line bg-card px-3.5 text-sm font-semibold transition active:scale-95 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {c.name}
              </span>
            </label>
          ))}
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex min-h-9 items-center gap-1 rounded-full border border-dashed border-accent px-3.5 text-sm font-semibold text-accent transition active:scale-95"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Nueva
            </button>
          )}
        </div>
        {adding && (
          <div className="mt-1 flex items-center gap-2 rounded-2xl bg-card p-2 pl-4">
            <input
              aria-label="Nombre de la nueva categoría"
              autoFocus
              maxLength={40}
              placeholder="Ej. Mascotas"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
            />
            <button type="button" onClick={() => setAdding(false)} className="min-h-9 px-2 text-[15px] text-muted">
              Cancelar
            </button>
            <button
              type="button"
              onClick={addCategory}
              disabled={creating || !newName.trim()}
              className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {creating && <Spinner />}
              Crear
            </button>
          </div>
        )}
      </fieldset>

      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-28 shrink-0 text-base">Descripción</span>
          <input name="description" maxLength={80} placeholder="Ej. Mercado" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-base">Fecha</span>
          <input name="date" type="date" required defaultValue={defaultDate} className="rounded-lg bg-field px-2.5 py-1.5 text-[15px] font-medium text-accent outline-none" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4">
          <span className="text-base">Gasto fijo (se repite cada mes)</span>
          <input name="fijo" type="checkbox" role="switch" className="peer sr-only" />
          <span aria-hidden="true" className="flex h-[31px] w-[51px] shrink-0 items-center rounded-full bg-switch p-0.5 transition-colors peer-checked:bg-ok peer-checked:*:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            <span className="size-[27px] rounded-full bg-white shadow transition-transform" />
          </span>
        </label>
      </div>

      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar gasto" />
    </form>
  );
}
