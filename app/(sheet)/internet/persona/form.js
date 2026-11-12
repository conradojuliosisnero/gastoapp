"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePerson, savePerson } from "@/app/(app)/internet/actions";
import { computeShares } from "@/lib/internet";
import { formatCOP, parseAmount, typingMoney } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { Field, FormError, Section, inputCls } from "@/app/form-kit";

export default function PersonForm({ member, splitMode, planAmount, othersTotal, count }) {
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const [share, setShare] = useState(member?.share ? typingMoney(String(member.share)) : "");
  const [deleting, startDeleting] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await savePerson(prev, formData);
    if (result.ok) {
      toast(result.created ? `${result.name} agregado al plan` : "Cambios guardados");
      router.push("/internet");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const custom = splitMode === "custom";
  const newCount = member ? count : count + 1;
  const equalShare = computeShares(planAmount, Array.from({ length: newCount }), "equal").at(-1);
  const sum = othersTotal + (parseAmount(share) ?? 0);
  const footer = custom
    ? sum === planAmount
      ? "Las partes suman exactamente el valor del plan."
      : `Con esta parte suman ${formatCOP(sum)} de ${formatCOP(planAmount)}. ${sum < planAmount ? `Faltan ${formatCOP(planAmount - sum)}.` : `Sobran ${formatCOP(sum - planAmount)}.`} Ajusta las demás en Editar plan.`
    : `El plan se reparte en partes iguales: ${member ? "" : "con esta persona "}cada uno pone ${formatCOP(equalShare)}.`;

  async function remove() {
    const ok = await confirm({
      title: `¿Quitar a ${member.name} del plan?`,
      message: "Se borra también su historial de pagos.",
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (!ok) return;
    startDeleting(async () => {
      const result = await deletePerson(member.id);
      if (result.error) return toast(result.error, "error");
      toast(`${result.name} quitado del plan`);
      router.push("/internet");
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {dialog}
      <SheetHeader title={member ? (member.isMe ? "Tu parte" : "Editar persona") : "Agregar persona"} cancelHref="/internet" />
      <input type="hidden" name="id" value={member?.id ?? ""} />

      <Section title="Persona" footer={footer}>
        <Field label="Nombre">
          <input name="name" required autoFocus={!member} maxLength={40} defaultValue={member?.name ?? ""} placeholder="Ej. Ana" className={`${inputCls} text-right`} />
        </Field>
        {custom && (
          <Field label="Su parte" hint="cada mes">
            <span className="flex min-w-0 flex-1 items-baseline justify-end gap-1">
              <span aria-hidden="true" className="text-[15px] text-muted">$</span>
              <input
                name="share"
                aria-label="Su parte"
                inputMode="numeric"
                required
                placeholder="0"
                value={share}
                onChange={(e) => setShare(typingMoney(e.target.value))}
                className={`${inputCls} max-w-36 text-right font-semibold tabular-nums`}
              />
            </span>
          </Field>
        )}
      </Section>

      {member && !member.isMe && (
        <button type="button" onClick={remove} disabled={deleting} className="flex min-h-11 items-center justify-center gap-2 self-center rounded-full px-4 text-[15px] font-semibold text-danger transition active:scale-95 active:bg-danger/10">
          {deleting && <Spinner />}
          Quitar del plan
        </button>
      )}
      <FormError error={state?.error} />
      <SaveBar pending={pending} label={member ? "Guardar cambios" : "Agregar persona"} />
    </form>
  );
}
