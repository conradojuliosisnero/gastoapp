"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveGamesLimit } from "@/app/(app)/juegos/actions";
import { parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function LimitForm({ current }) {
  const router = useRouter();
  const [amount, setAmount] = useState(current ? `$${group.format(current)}` : "");
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveGamesLimit(prev, formData);
    if (result.ok) {
      toast(result.cleared ? "Límite quitado" : "Límite guardado");
      router.push("/juegos");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Límite mensual" cancelHref="/juegos" />
      <label className="flex flex-col items-center gap-1 py-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">Máximo al mes en juegos (COP)</span>
        <input
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="Sin límite"
          value={amount}
          onChange={(e) => {
            const n = parseAmount(e.target.value);
            setAmount(n == null ? "" : `$${group.format(n)}`);
          }}
          className="w-full bg-transparent text-center text-[44px] font-bold tracking-tight outline-none placeholder:text-muted"
        />
      </label>
      <p className="px-1 text-[13px] text-muted">Te avisamos cuando lo pases. Déjalo vacío para quitar el límite.</p>
      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar límite" />
    </form>
  );
}
