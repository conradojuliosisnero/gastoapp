"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, createTransaction } from "@/app/(app)/gastos/actions";
import { formatCOP, formatMoney, parseMoney, typingMoney, usdToCop } from "@/lib/money";
import { installments } from "@/lib/credit";
import Link from "next/link";
import { toast } from "@/lib/toast";
import Spinner from "@/app/spinner";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { AmountHero, ChoiceChips, Field, FormError, Plus, Section, Segmented, SwitchField, dateCls, inputCls } from "@/app/form-kit";

const COPY = {
  gastos: { title: "Nuevo gasto", back: "/gastos", hint: "Ej. Mercado", save: "Guardar gasto", saved: "Gasto guardado", newCat: "Ej. Mascotas", legend: "Categoría", what: "Descripción" },
  juegos: { title: "Nueva compra", back: "/juegos", hint: "Ej. Expansión de historia", save: "Guardar compra", saved: "Compra guardada", newCat: "Ej. Pase de batalla", legend: "Tipo", what: "Juego" },
};

// New expense or game purchase; with `tx` it edits an existing one (same form, prefilled).
export default function NewExpenseForm({ categories: initialCategories, defaultDate, module = "gastos", usdRate = null, cards = [], tx = null }) {
  const copy = tx ? { ...COPY[module], title: module === "juegos" ? "Editar compra" : "Editar gasto", back: `${COPY[module].back}?mes=${tx.date.slice(0, 7)}`, save: "Guardar cambios", saved: "Cambios guardados" } : COPY[module];
  const router = useRouter();
  const [amount, setAmount] = useState(tx ? (tx.currency === "USD" ? (tx.usd / 100).toFixed(2) : typingMoney(String(tx.amount))) : "");
  const [currency, setCurrency] = useState(tx?.currency ?? "COP");
  const [platform, setPlatform] = useState(tx?.platform ?? "PS5");
  const [date, setDate] = useState(tx?.date ?? defaultDate);
  const [cardId, setCardId] = useState(tx?.cardId ?? "");
  const [count, setCount] = useState(String(tx?.installments ?? 1));
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected] = useState(tx ? (tx.categoryId ?? "") : (initialCategories[0]?.id ?? ""));
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
    tx?.currency === "USD" && parseMoney(amount, "USD") === tx.usd
      ? `≈ ${formatCOP(tx.amount)} · tasa del día de la compra`
      : currency !== "USD"
      ? null
      : !usdRate
        ? "No pudimos traer la tasa del dólar ahora. Intenta en un rato o registra en COP."
        : cents
          ? `≈ ${formatCOP(usdToCop(cents, usdRate))} · 1 US$ = ${formatCOP(Math.round(usdRate))}`
          : `Tasa de hoy: 1 US$ = ${formatCOP(Math.round(usdRate))}`;

  const card = cards.find((c) => c.id === cardId);
  const pesos = currency === "USD" ? (cents && usdRate ? usdToCop(cents, usdRate) : null) : parseMoney(amount);
  const nCuotas = Math.min(48, Math.max(1, Number(count) || 1));
  const plan = card && pesos ? installments({ date, amount: pesos, count: nCuotas }, card) : null;
  const monthYear = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", timeZone: "UTC" });
  const creditHint = !cards.length
    ? null
    : !card
      ? "Elige una tarjeta para pagar a crédito y en cuotas."
      : plan
        ? `${nCuotas === 1 ? "Una cuota" : `${nCuotas} cuotas de ≈ ${formatCOP(plan[plan.length - 1].amount)}`}. La primera se paga el ${monthYear.format(new Date(`${plan[0].date}T00:00:00Z`))}${currency === "USD" ? " (en pesos, tasa de hoy)" : ""}.`
        : `Corte el día ${card.cutDay}, pago el día ${card.payDay}.`;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title={copy.title} cancelHref={copy.back} />
      <input type="hidden" name="module" value={module} />
      {tx && <input type="hidden" name="id" value={tx.id} />}

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
        autoFocus={!tx}
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
          <input name="description" maxLength={80} placeholder={copy.hint} defaultValue={tx?.description ?? ""} className={`${inputCls} text-right`} />
        </Field>
        <Field label="Fecha">
          <input name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={dateCls} />
        </Field>
        {module === "juegos" ? (
          <Field label="Plataforma" as="div">
            <Segmented label="Plataforma" name="platform" options={["PS5", "PC", "Otra"]} value={platform} onChange={setPlatform} />
          </Field>
        ) : (
          <SwitchField name="fijo" label="Gasto fijo" hint="Se repite cada mes" defaultChecked={tx?.kind === "fijo"} />
        )}
      </Section>

      <Section
        title="Medio de pago"
        footer={
          cards.length ? (
            creditHint
          ) : (
            <>
              ¿Pagas con tarjeta de crédito? <Link href="/tarjetas/tarjeta" className="font-semibold text-accent">Agrega tu tarjeta</Link> para llevar las cuotas.
            </>
          )
        }
      >
        <Field label="Pago">
          <select
            name="cardId"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-lg bg-field px-2.5 py-1.5 text-right text-[15px] font-semibold text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">Débito o efectivo</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                Crédito · {c.name}
              </option>
            ))}
          </select>
        </Field>
        {card && (
          <Field label="Cuotas" hint="1 a 48">
            <input
              name="installments"
              type="number"
              inputMode="numeric"
              min={1}
              max={48}
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={`${inputCls} max-w-16 text-right font-semibold tabular-nums`}
            />
          </Field>
        )}
      </Section>

      <FormError error={state?.error} />
      <SaveBar pending={pending} label={cents && usdRate ? `${copy.save} · ${formatMoney(cents, "USD")}` : copy.save} />
    </form>
  );
}
