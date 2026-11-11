"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createTransaction } from "@/app/(app)/gastos/actions";
import { parseAmount } from "@/lib/money";

const group = new Intl.NumberFormat("es-CO");

export default function NewExpenseForm({ categories, defaultDate }) {
  const [state, formAction, pending] = useActionState(createTransaction, null);
  const [amount, setAmount] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/gastos" className="flex min-h-11 items-center text-[17px] text-accent">Cancelar</Link>
        <h1 className="text-[17px] font-semibold">Nuevo gasto</h1>
        <button type="submit" disabled={pending} className="flex min-h-11 items-center justify-end text-[17px] font-semibold text-accent disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>

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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <label key={c.id} className="cursor-pointer">
              <input type="radio" name="categoryId" value={c.id} defaultChecked={i === 0} className="peer sr-only" />
              <span className="flex min-h-9 items-center rounded-full bg-card px-3.5 text-sm font-semibold peer-checked:bg-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-28 shrink-0 text-base">Descripción</span>
          <input name="description" maxLength={80} placeholder="Ej. Mercado" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-base">Fecha</span>
          <input name="date" type="date" required defaultValue={defaultDate} className="rounded-lg bg-[#eaf2fd] px-2.5 py-1.5 text-[15px] font-medium text-accent outline-none" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4">
          <span className="text-base">Gasto fijo (se repite cada mes)</span>
          <input name="fijo" type="checkbox" role="switch" className="peer sr-only" />
          <span aria-hidden="true" className="flex h-[31px] w-[51px] shrink-0 items-center rounded-full bg-[#d1d1d6] p-0.5 transition-colors peer-checked:bg-ok peer-checked:*:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            <span className="size-[27px] rounded-full bg-white shadow transition-transform" />
          </span>
        </label>
      </div>

      <p aria-live="polite" className="min-h-5 px-1 text-sm text-warn">{state?.error}</p>
    </form>
  );
}
