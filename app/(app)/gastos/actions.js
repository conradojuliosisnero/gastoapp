"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { monthRange, parseAmount } from "@/lib/money";

const MAX_AMOUNT = 1_000_000_000_000;

const newTransaction = z.object({
  amount: z.number({ error: "Escribe el monto." }).int().positive("El monto debe ser mayor a cero.").max(MAX_AMOUNT, "Monto demasiado grande."),
  categoryId: z.uuid().nullable(),
  description: z.string().trim().max(80, "La descripción es muy larga."),
  date: z.iso.date("Fecha inválida."),
  kind: z.enum(["fijo", "variable"]),
  module: z.enum(["gastos", "juegos"]),
  platform: z.enum(["PS5", "PC", "Otra"]).nullable(),
});

export async function createTransaction(_prev, formData) {
  const parsed = newTransaction.safeParse({
    amount: parseAmount(formData.get("amount")) ?? undefined,
    categoryId: formData.get("categoryId") || null,
    description: formData.get("description") ?? "",
    date: formData.get("date"),
    kind: formData.get("fijo") ? "fijo" : "variable",
    module: formData.get("module") || "gastos",
    platform: formData.get("platform") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, categoryId, description, date, kind, module, platform } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    module,
    platform: module === "juegos" ? platform : null,
    category_id: categoryId,
    occurred_on: date,
    kind,
    amount_enc: encrypt(amount),
    description_enc: description ? encrypt(description) : null,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  refresh();
  return { ok: true, mes: date.slice(0, 7), module };
}

export async function deleteTransaction(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Movimiento inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar. Intenta de nuevo." };
  refresh();
  return { ok: true };
}

// Copies last month's fixed expenses into this month, keeping the day (clamped to the month's length).
export async function copyFixedFromPreviousMonth(mes) {
  const target = monthRange(mes);
  const source = monthRange(target.prev);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, occurred_on, amount_enc, description_enc")
    .eq("module", "gastos")
    .eq("kind", "fijo")
    .gte("occurred_on", source.start)
    .lt("occurred_on", source.end);
  if (error) return { error: "No se pudieron leer los gastos fijos." };

  const lastDay = new Date(`${target.end}T00:00:00Z`);
  lastDay.setUTCDate(0);
  const rows = data.map((t) => ({
    module: "gastos",
    kind: "fijo",
    category_id: t.category_id,
    occurred_on: `${target.key}-${String(Math.min(Number(t.occurred_on.slice(8)), lastDay.getUTCDate())).padStart(2, "0")}`,
    amount_enc: t.amount_enc,
    description_enc: t.description_enc,
  }));

  if (rows.length) {
    const { error: insertError } = await supabase.from("transactions").insert(rows);
    if (insertError) return { error: "No se pudieron copiar los gastos fijos." };
  }
  refresh();
  return { ok: true, count: rows.length };
}

export async function saveBudgets(_prev, formData) {
  const entries = [...formData.entries()].filter(([key]) => key.startsWith("budget:"));
  const budgets = [];
  for (const [key, value] of entries) {
    const id = key.slice("budget:".length);
    const amount = parseAmount(value);
    if (!z.uuid().safeParse(id).success) return { error: "Categoría inválida." };
    if (amount != null && amount > MAX_AMOUNT) return { error: "Un presupuesto es demasiado grande." };
    budgets.push({ id, amount });
  }

  const supabase = await createClient();
  const results = await Promise.all(
    budgets.map(({ id, amount }) => supabase.from("categories").update({ monthly_budget_enc: amount ? encrypt(amount) : null }).eq("id", id))
  );
  if (results.some((r) => r.error)) return { error: "No se pudieron guardar los presupuestos." };
  refresh();
  return { ok: true };
}

const categoryName = z.string().trim().min(1, "Escribe un nombre.").max(40, "Máximo 40 caracteres.");

export async function createCategory(name, module = "gastos") {
  if (!["gastos", "juegos"].includes(module)) return { error: "Módulo inválido." };
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ module, name: parsed.data, sort: 100 })
    .select("id, name")
    .single();
  if (error?.code === "23505") return { error: `Ya tienes una categoría "${parsed.data}".` };
  if (error) return { error: "No se pudo crear la categoría." };
  refresh();
  return { ok: true, category: data };
}

// Its expenses stay, marked "Sin categoría" (the FK sets category_id to null).
export async function deleteCategory(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Categoría inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar la categoría." };
  refresh();
  return { ok: true };
}
