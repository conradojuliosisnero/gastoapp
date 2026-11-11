"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, createTransaction } from "@/app/(app)/gastos/actions";
import { formatCOP, formatMoney, parseMoney, usdToCop } from "@/lib/money";
import { toast } from "@/lib/toast";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { AmountHero, ChoiceChips, Field, FormError, Plus, Section, Segmented, SwitchField, dateCls, inputCls } from "@/app/form-kit";

const COPY = {
  gastos: { title: "Nuevo gasto", back: "/gastos", hint: "Ej. Mercado", save: "Guardar gasto", saved: "Gasto guardado", newCat: "Ej. Mascotas", legend: "Categoría", what: "Descripción" },
  juegos: { title: "Nueva compra", back: "/juegos", hint: "Ej. Expansión de historia", save: "Guardar compra", saved: "Compra guardada", newCat: "Ej. Pase de batalla", legend: "Tipo", what: "Juego" },
};

export default function NewExpenseForm({ categories: initialCategories, defaultDate, module = "gastos", usdRate = null }) {
  const copy = COPY[module];
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [platform, setPlatform] = useState("PS5");
  const [date, setDate] = useState(defaultDate);
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected] = useState(initialCategories[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, startCreating] = useTransition();

  function addCategory() {
    startCreating(async () => {
      const result = await createCategory(newName, module);
      if (result.error) return toast(result.error, "error");
      setCategories((list) => [...list, result.category]);
      setSelected(result.category.id);
      setNewName("");
      setAdding(false);
      toast(`Categoría "${result.category.name}" creada`);
    });
  }

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createTransaction(prev, formData);
    if (result.ok) {
      setAmount(""); // the form stays mounted (hidden) after leaving; start clean next time
      toast(copy.saved);
      router.push(`/${result.module}?mes=${result.mes}`);
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  const cents = currency === "USD" ? parseMoney(amount, "USD") : null;
  const usdHint =
    currency !== "USD"
      ? null
      : !usdRate
        ? "No pudimos traer la tasa del dólar ahora. Intenta en un rato o registra en COP."
        : cents
          ? `≈ ${formatCOP(usdToCop(cents, usdRate))} · 1 US$ = ${formatCOP(Math.round(usdRate))}`
          : `Tasa de hoy: 1 US$ = ${formatCOP(Math.round(usdRate))}`;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title={copy.title} cancelHref={copy.back} />
      <input type="hidden" name="module" value={module} />

      <AmountHero
        label="Monto"
        value={amount}
        onValue={setAmount}
        currency={currency}
        currencies={module === "juegos" ? ["COP", "USD"] : null}
        onCurrency={(c) => {
          setCurrency(c);
          setAmount("");
        }}
        hint={usdHint}
        required
        autoFocus
      />

      <Section
        title={copy.legend}
        footer={adding ? null : `Toca una ${copy.legend.toLowerCase()} o crea una nueva.`}
      >
        <ChoiceChips name="categoryId" label={copy.legend} options={categories} value={selected} onChange={setSelected}>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex min-h-9 items-center gap-1 rounded-full border border-dashed border-accent/70 px-3.5 text-sm font-semibold text-accent transition active:scale-95"
            >
              <Plus />
              Nueva
            </button>
          )}
        </ChoiceChips>
        {adding && (
          <div className="flex items-center gap-2 py-2 pr-2 pl-4">
            <input
              aria-label="Nombre de la nueva categoría"
              autoFocus
              maxLength={40}
              placeholder={copy.newCat}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              className={inputCls}
            />
            <button type="button" onClick={() => setAdding(false)} className="min-h-9 px-2 text-[15px] text-muted">
              Cancelar
            </button>
            <button
              type="button"
              onClick={addCategory}
              disabled={creating || !newName.trim()}
              className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {creating && <Spinner />}
              Crear
            </button>
          </div>
        )}
      </Section>

      <Section
        title="Detalles"
        footer={date > defaultDate ? "Fecha futura: quedará como “Pago futuro” y no se descuenta hasta ese día." : null}
      >
        <Field label={copy.what}>
          <input name="description" maxLength={80} placeholder={copy.hint} className={`${inputCls} text-right`} />
        </Field>
        <Field label="Fecha">
          <input name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={dateCls} />
        </Field>
        {module === "juegos" ? (
          <Field label="Plataforma" as="div">
            <Segmented label="Plataforma" name="platform" options={["PS5", "PC", "Otra"]} value={platform} onChange={setPlatform} />
          </Field>
        ) : (
          <SwitchField name="fijo" label="Gasto fijo" hint="Se repite cada mes" />
        )}
      </Section>

      <FormError error={state?.error} />
      <SaveBar pending={pending} label={cents && usdRate ? `${copy.save} · ${formatMoney(cents, "USD")}` : copy.save} />
    </form>
  );
}
