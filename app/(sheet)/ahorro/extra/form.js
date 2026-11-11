"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createExtraIncome } from "@/app/(app)/inicio/actions";
import { parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function ExtraIncomeForm({ defaultDate }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createExtraIncome(prev, formData);
    if (result.ok) {
      setAmount("");
      toast("Ingreso extra guardado");
      router.push("/inicio");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Ingreso extra" cancelHref="/inicio" />

      <label className="flex flex-col items-center gap-1 py-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Monto recibido (COP)</span>
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
          className="w-full bg-transparent text-center text-[52px] font-bold tracking-tight text-ok outline-none placeholder:text-muted"
        />
      </label>

      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-28 shrink-0 text-base">De dónde</span>
          <input name="description" maxLength={80} placeholder="Ej. Venta, regalo, freelance" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-base">Fecha</span>
          <input name="date" type="date" required defaultValue={defaultDate} className="rounded-lg bg-field px-2.5 py-1.5 text-[15px] font-medium text-accent outline-none" />
        </label>
      </div>
      <p className="px-1 text-[13px] text-muted">Se suma al ahorro del mes en que lo recibiste. Se guarda cifrado.</p>

      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar ingreso" />
    </form>
  );
}
