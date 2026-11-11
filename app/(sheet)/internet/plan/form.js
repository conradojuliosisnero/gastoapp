"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { savePlan } from "@/app/(app)/internet/actions";
import { computeShares } from "@/lib/internet";
import { formatCOP, parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { Field, FormError, Plus, Section, Segmented, inputCls } from "@/app/form-kit";

const group = new Intl.NumberFormat("es-CO");
const money = (n) => (n == null ? "" : `$${group.format(n)}`);
let nextKey = 0;
const blank = (name = "") => ({ key: `n${nextKey++}`, id: null, name, share: null });

export default function PlanForm({ plan }) {
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const [amount, setAmount] = useState(plan?.amount ?? null);
  const [splitMode, setSplitMode] = useState(plan?.splitMode ?? "equal");
  const [removedIds, setRemovedIds] = useState([]);
  const [members, setMembers] = useState(
    plan ? plan.members.map((m) => ({ key: m.id, id: m.id, name: m.name, share: m.share })) : [blank("Yo"), blank(), blank()]
  );
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await savePlan(prev, formData);
    if (result.ok) {
      toast("Plan guardado");
      router.push("/internet");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const equalShares = amount ? computeShares(amount, members, "equal") : [];
  const customTotal = members.reduce((s, m) => s + (m.share ?? 0), 0);
  const update = (key, patch) => setMembers((list) => list.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  async function remove(m) {
    if (m.id) {
      const ok = await confirm({
        title: `¿Quitar a ${m.name || "este integrante"}?`,
        message: "Se borra su historial de pagos al guardar.",
        confirmLabel: "Quitar",
        destructive: true,
      });
      if (!ok) return;
    }
    if (m.id) setRemovedIds((ids) => [...ids, m.id]);
    setMembers((list) => list.filter((x) => x.key !== m.key));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {dialog}
      <SheetHeader title={plan ? "Editar plan" : "Plan de internet"} cancelHref="/internet" />

      <Section title="Plan">
        <Field label="Nombre">
          <input name="name" required maxLength={60} defaultValue={plan?.name ?? "Internet casa"} className={`${inputCls} text-right`} />
        </Field>
        <Field label="Valor mensual">
          <input
            name="amount"
            inputMode="numeric"
            required
            placeholder="$0"
            value={money(amount)}
            onChange={(e) => setAmount(parseAmount(e.target.value))}
            className={`${inputCls} text-right font-semibold tabular-nums`}
          />
        </Field>
        <Field label="Día de pago" hint="de cada mes">
          <input name="dueDay" type="number" inputMode="numeric" required min={1} max={31} defaultValue={plan?.dueDay ?? 15} className={`${inputCls} max-w-16 text-right font-semibold tabular-nums`} />
        </Field>
      </Section>

      <Section title="Cómo se divide" className="p-2">
        <Segmented label="Cómo se divide" name="splitMode" options={[["equal", "Partes iguales"], ["custom", "Personalizado"]]} value={splitMode} onChange={setSplitMode} full />
      </Section>

      <div className="flex flex-col gap-1.5">
        <h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Integrantes</h2>
        <input type="hidden" name="memberCount" value={members.length} />
        <input type="hidden" name="removed" value={removedIds.join(",")} />
        <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-line/70">
          {members.map((m, i) => (
            <li key={m.key} className="flex min-h-[52px] items-center gap-2 border-t border-line pr-1 pl-4 transition-colors first:border-t-0 focus-within:bg-fill/60">
              <input type="hidden" name={`member:${i}:id`} value={m.id ?? ""} />
              <input
                name={`member:${i}:name`}
                required
                maxLength={40}
                aria-label={i === 0 ? "Tu nombre" : `Nombre del integrante ${i + 1}`}
                placeholder={i === 0 ? "Tu nombre" : `Persona ${i + 1}`}
                value={m.name}
                onChange={(e) => update(m.key, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Tú</span>}
              {splitMode === "custom" ? (
                <input
                  name={`member:${i}:share`}
                  inputMode="numeric"
                  aria-label={`Parte de ${m.name || `la persona ${i + 1}`}`}
                  placeholder="$0"
                  value={money(m.share)}
                  onChange={(e) => update(m.key, { share: parseAmount(e.target.value) })}
                  className="w-28 bg-transparent text-right text-base outline-none placeholder:text-muted"
                />
              ) : (
                <span className="w-28 text-right text-[15px] text-muted tabular-nums">{equalShares[i] != null ? formatCOP(equalShares[i]) : "—"}</span>
              )}
              {i === 0 ? (
                <span className="size-10 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => remove(m)}
                  disabled={members.length <= 2}
                  aria-label={`Quitar a ${m.name || `la persona ${i + 1}`}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-danger transition active:scale-90 disabled:opacity-30"
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                </button>
              )}
            </li>
          ))}
        </ul>
        {members.length < 8 && (
          <button
            type="button"
            onClick={() => setMembers((list) => [...list, blank()])}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/70 text-[15px] font-semibold text-accent transition active:scale-[0.99]"
          >
            <Plus />
            Agregar persona
          </button>
        )}
        {splitMode === "custom" && amount != null && (
          <p className={`px-4 text-[13px] font-medium ${customTotal === amount ? "text-ok" : "text-warn"}`}>
            Suman {formatCOP(customTotal)} de {formatCOP(amount)}
            {customTotal !== amount && ` · faltan ${formatCOP(amount - customTotal)}`}
          </p>
        )}
      </div>

      <p className="px-4 text-[13px] text-muted">Los nombres y montos se guardan cifrados. Cuando marques tu parte como pagada, también se suma a tus gastos (Servicios).</p>
      <FormError error={state?.error} />
      <SaveBar pending={pending} label="Guardar plan" />
    </form>
  );
}
