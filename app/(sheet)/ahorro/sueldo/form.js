"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSalary } from "@/app/(app)/inicio/actions";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { AmountHero, Field, FormError, Section, dateCls } from "@/app/form-kit";

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
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title="Sueldo mensual" cancelHref="/inicio" />

      <AmountHero
        label="Sueldo mensual (COP)"
        value={amount}
        onValue={setAmount}
        masked={hidden}
        required
        autoFocus
        hint="Se guarda cifrado y en pantalla se muestra oculto."
        trailing={
          <button
            type="button"
            aria-label={hidden ? "Mostrar lo que escribo" : "Ocultar lo que escribo"}
            aria-pressed={!hidden}
            onClick={() => setHidden((h) => !h)}
            className="flex size-11 shrink-0 items-center justify-center self-center rounded-full text-accent transition active:scale-90 active:bg-accent/10"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {hidden && <path d="M3 3l18 18" />}
            </svg>
          </button>
        }
      />

      <Section footer="Aplica desde ese mes hasta que lo cambies. El ahorro se cuenta desde el mes en que empiezas a registrarlo aquí.">
        <Field label="Desde el mes">
          <input name="period" type="month" required defaultValue={defaultPeriod} className={dateCls} />
        </Field>
      </Section>

      <FormError error={state?.error} />
      <SaveBar pending={pending} label="Guardar sueldo" />
    </form>
  );
}
