"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createExtraIncome } from "@/app/(app)/inicio/actions";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { AmountHero, Field, FormError, Section, dateCls, inputCls } from "@/app/form-kit";

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
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title="Ingreso extra" cancelHref="/inicio" />
      <AmountHero label="Monto recibido" value={amount} onValue={setAmount} tone="text-ok" required autoFocus />
      <Section title="Detalles" footer="Se suma al ahorro del mes en que lo recibiste. Se guarda cifrado.">
        <Field label="De dónde">
          <input name="description" maxLength={80} placeholder="Ej. Venta, regalo, freelance" className={`${inputCls} text-right`} />
        </Field>
        <Field label="Fecha">
          <input name="date" type="date" required defaultValue={defaultDate} className={dateCls} />
        </Field>
      </Section>
      <FormError error={state?.error} />
      <SaveBar pending={pending} label="Guardar ingreso" />
    </form>
  );
}
