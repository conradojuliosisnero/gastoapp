"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSalary } from "@/app/(app)/inicio/actions";
import { parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");

export default function SalaryForm({ defaultPeriod }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [hidden, setHidden] = useState(true);
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveSalary(prev, formData);
    if (result.ok) {
      setAmount("");
      toast("Sueldo guardado");
      router.push("/inicio");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);
  // Next keeps left screens mounted but hidden; don't leave the typed salary sitting in the page.
  useEffect(() => () => setAmount(""), []);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Sueldo mensual" cancelHref="/inicio" />

      <div className="flex flex-col items-center gap-1 py-3">
        <label htmlFor="amount" className="text-[13px] font-semibold uppercase tracking-wide text-muted">Sueldo mensual (COP)</label>
        <div className="flex w-full items-center gap-1">
          <input
            id="amount"
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
            style={hidden ? { WebkitTextSecurity: "disc" } : undefined}
            className="min-w-0 flex-1 bg-transparent text-center text-[44px] font-bold tracking-tight outline-none"
          />
          <button
            type="button"
            aria-label={hidden ? "Mostrar lo que escribo" : "Ocultar lo que escribo"}
            aria-pressed={!hidden}
            onClick={() => setHidden((h) => !h)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-accent active:bg-accent/10"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {hidden && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-base">Desde el mes</span>
          <input name="period" type="month" required defaultValue={defaultPeriod} className="rounded-lg bg-field px-2.5 py-1.5 text-[15px] font-medium text-accent outline-none" />
        </label>
      </div>
      <p className="px-1 text-[13px] text-muted">
        Se guarda cifrado y en pantalla se muestra oculto. Aplica desde ese mes hasta que lo cambies; el ahorro se cuenta desde el mes en que empiezas a registrarlo aquí.
      </p>

      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Guardar sueldo" />
    </form>
  );
}
