"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createWish } from "@/app/(app)/juegos/actions";
import { typingMoney } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { Field, FormError, Section, Segmented, inputCls } from "@/app/form-kit";

export default function WishForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState("PS5");
  const [currency, setCurrency] = useState("COP");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createWish(prev, formData);
    if (result.ok) {
      toast("Agregado a tu lista de deseos");
      router.push("/juegos");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const symbol = currency === "USD" ? "US$" : "$";
  const price = (name, value, set, placeholder, required) => (
    <span className="flex min-w-0 flex-1 items-baseline justify-end gap-1">
      <span aria-hidden="true" className="text-[15px] text-muted">{symbol}</span>
      <input
        id={name}
        name={name}
        inputMode={currency === "USD" ? "decimal" : "numeric"}
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => set(typingMoney(e.target.value, currency))}
        className={`${inputCls} max-w-36 text-right font-semibold tabular-nums`}
      />
    </span>
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title="Lista de deseos" cancelHref="/juegos" />

      <Section title="Juego">
        <Field label="Nombre">
          <input name="title" required autoFocus maxLength={80} placeholder="Ej. Juego de fútbol 2027" className={`${inputCls} text-right`} />
        </Field>
        <Field label="Plataforma" as="div">
          <Segmented label="Plataforma" name="platform" options={["PS5", "PC", "Otra"]} value={platform} onChange={setPlatform} />
        </Field>
      </Section>

      <Section title="Precio" footer="Te avisamos con “¡Llegó a tu precio!” cuando el precio actual baje a tu objetivo.">
        <Field label="Moneda" as="div">
          <Segmented
            label="Moneda"
            name="currency"
            options={["COP", "USD"]}
            value={currency}
            onChange={(c) => {
              setCurrency(c);
              setCurrent("");
              setTarget("");
            }}
          />
        </Field>
        <Field label="Precio actual">{price("current", current, setCurrent, "0", true)}</Field>
        <Field label="Lo compro a" hint="Opcional">{price("target", target, setTarget, "Opcional", false)}</Field>
      </Section>

      <FormError error={state?.error} />
      <SaveBar pending={pending} label="Agregar a la lista" />
    </form>
  );
}
