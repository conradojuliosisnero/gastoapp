"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubscription, saveSubscription } from "@/app/(app)/anual/actions";
import { formatMoney, parseMoney, typingMoney } from "@/lib/money";
import { compare } from "@/lib/subscriptions";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../sheet-header";
import { Field, FormError, Section, Segmented, dateCls, inputCls } from "@/app/form-kit";

const show = (n, currency) => (n == null ? "" : currency === "USD" ? (n / 100).toFixed(2) : typingMoney(String(n)));

export default function SubscriptionForm({ sub, cards = [] }) {
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const [currency, setCurrency] = useState(sub?.currency ?? "COP");
  const [monthly, setMonthly] = useState(show(sub?.monthly, sub?.currency));
  const [annual, setAnnual] = useState(show(sub?.annual, sub?.currency));
  const [billing, setBilling] = useState(sub?.billing ?? "mensual");
  const [deleting, startDeleting] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveSubscription(prev, formData);
    if (result.ok) {
      toast(sub ? "Suscripción actualizada" : `"${result.name}" agregada`);
      router.push("/anual");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const m = parseMoney(monthly, currency);
  const a = parseMoney(annual, currency);
  const c = compare({ monthly: m || null, annual: a || null, billing });
  const money = (n) => formatMoney(n, currency);
  const verdict =
    c.best === "anual"
      ? `El plan anual te ahorra ${money(c.saving)} al año (${c.pct}%) frente a 12 pagos de ${money(m)}.`
      : c.best === "mensual"
        ? `Pagar mes a mes sale ${money(c.saving)} más barato al año que el plan anual.`
        : m && a
          ? "Mensual y anual cuestan lo mismo al año."
          : "Escribe ambos precios para saber si conviene el plan de 12 meses.";

  const field = (name, value, set, placeholder) => (
    <span className="flex min-w-0 flex-1 items-baseline justify-end gap-1">
      <span aria-hidden="true" className="text-[15px] text-muted">{currency === "USD" ? "US$" : "$"}</span>
      <input
        name={name}
        inputMode={currency === "USD" ? "decimal" : "numeric"}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => set(typingMoney(e.target.value, currency))}
        className={`${inputCls} max-w-36 text-right font-semibold tabular-nums`}
      />
    </span>
  );

  async function remove() {
    if (!(await confirm({ title: `¿Borrar "${sub.name}"?`, message: "Tus gastos registrados no cambian.", confirmLabel: "Borrar", destructive: true }))) return;
    startDeleting(async () => {
      const result = await deleteSubscription(sub.id);
      if (result.error) return toast(result.error, "error");
      toast("Suscripción borrada");
      router.push("/anual");
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {dialog}
      <SheetHeader title={sub ? "Editar suscripción" : "Nueva suscripción"} cancelHref="/anual" />
      <input type="hidden" name="id" value={sub?.id ?? ""} />

      <Section title="Suscripción">
        <Field label="Nombre">
          <input name="name" required autoFocus={!sub} maxLength={40} defaultValue={sub?.name ?? ""} placeholder="Ej. PlayStation Plus" className={`${inputCls} text-right`} />
        </Field>
        <Field label="Moneda" as="div">
          <Segmented
            label="Moneda"
            name="currency"
            options={["COP", "USD"]}
            value={currency}
            onChange={(cur) => {
              setCurrency(cur);
              setMonthly("");
              setAnnual("");
            }}
          />
        </Field>
      </Section>

      <Section title="Precios" footer={verdict}>
        <Field label="Precio mensual">{field("monthly", monthly, setMonthly, "0")}</Field>
        <Field label="Plan anual" hint="12 meses, opcional">{field("annual", annual, setAnnual, "Opcional")}</Field>
        <Field label="Hoy la pago" as="div">
          <Segmented label="Hoy la pago" name="billing" options={[["mensual", "Mensual"], ["anual", "Anual"]]} value={billing} onChange={setBilling} />
        </Field>
      </Section>

      <Section title="Renovación" footer="Te avisamos unos días antes de que se renueve. La extensión SubTrack usa estos mismos datos.">
        <Field label="Dónde la compraste" hint="tienda o sitio">
          <input name="source" maxLength={120} defaultValue={sub?.source ?? ""} placeholder="Ej. Google Play, netflix.com" className={`${inputCls} text-right`} />
        </Field>
        <Field label="Próxima renovación">
          <input name="renewsOn" type="date" defaultValue={sub?.renewsOn ?? ""} className={dateCls} />
        </Field>
        <Field label="Se cobra a">
          <select
            name="cardId"
            aria-label="Se cobra a"
            defaultValue={sub?.cardId ?? ""}
            className="min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-lg bg-field px-2.5 py-1.5 text-right text-[15px] font-semibold text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">Débito u otro medio</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {sub && (
        <button type="button" onClick={remove} disabled={deleting} className="flex min-h-11 items-center justify-center gap-2 self-center rounded-full px-4 text-[15px] font-semibold text-danger transition active:scale-95 active:bg-danger/10">
          {deleting && <Spinner />}
          Borrar suscripción
        </button>
      )}
      <FormError error={state?.error} />
      <SaveBar pending={pending} label={sub ? "Guardar cambios" : "Agregar suscripción"} />
    </form>
  );
}
