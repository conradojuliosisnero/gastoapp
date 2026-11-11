"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCard, saveCard } from "@/app/(app)/tarjetas/actions";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { Field, FormError, Section, inputCls } from "@/app/form-kit";

const dayCls = `${inputCls} max-w-16 text-right font-semibold tabular-nums`;

export default function CardForm({ card }) {
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const [cut, setCut] = useState(card?.cutDay ?? "");
  const [pay, setPay] = useState(card?.payDay ?? "");
  const [deleting, startDeleting] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveCard(prev, formData);
    if (result.ok) {
      toast(card ? "Tarjeta actualizada" : `Tarjeta "${result.name}" agregada`);
      router.push("/tarjetas");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const c = Number(cut);
  const p = Number(pay);
  const explain =
    c >= 1 && c <= 31 && p >= 1 && p <= 31 && c !== p
      ? `Lo que compres hasta el ${c} de cada mes lo pagas el ${p} ${p > c ? "de ese mismo mes" : "del mes siguiente"}.`
      : "Mira el día de corte y el de pago en tu extracto o en la app del banco.";

  async function remove() {
    const ok = await confirm({
      title: `¿Borrar "${card.name}"?`,
      message: "Sus compras se conservan como pagadas de contado y dejan de generar cuotas.",
      confirmLabel: "Borrar",
      destructive: true,
    });
    if (!ok) return;
    startDeleting(async () => {
      const result = await deleteCard(card.id);
      if (result.error) return toast(result.error, "error");
      toast("Tarjeta borrada");
      router.push("/tarjetas");
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {dialog}
      <SheetHeader title={card ? "Editar tarjeta" : "Nueva tarjeta"} cancelHref="/tarjetas" />
      <input type="hidden" name="id" value={card?.id ?? ""} />

      <Section title="Tarjeta" footer="Solo guardamos un nombre para reconocerla. Nunca escribas el número ni datos de la tarjeta.">
        <Field label="Nombre">
          <input name="name" required autoFocus={!card} maxLength={40} defaultValue={card?.name ?? ""} placeholder="Ej. Visa Bancolombia" className={`${inputCls} text-right`} />
        </Field>
      </Section>

      <Section title="Fechas" footer={explain}>
        <Field label="Día de corte" hint="de cada mes">
          <input name="cutDay" type="number" inputMode="numeric" required min={1} max={31} placeholder="15" value={cut} onChange={(e) => setCut(e.target.value)} className={dayCls} />
        </Field>
        <Field label="Día de pago" hint="fecha límite">
          <input name="payDay" type="number" inputMode="numeric" required min={1} max={31} placeholder="30" value={pay} onChange={(e) => setPay(e.target.value)} className={dayCls} />
        </Field>
      </Section>

      {card && (
        <button type="button" onClick={remove} disabled={deleting} className="flex min-h-11 items-center justify-center gap-2 self-center rounded-full px-4 text-[15px] font-semibold text-danger transition active:scale-95 active:bg-danger/10">
          {deleting && <Spinner />}
          Borrar tarjeta
        </button>
      )}
      <FormError error={state?.error} />
      <SaveBar pending={pending} label={card ? "Guardar cambios" : "Agregar tarjeta"} />
    </form>
  );
}
