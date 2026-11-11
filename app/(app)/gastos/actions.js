"use server";

import { redirect } from "next/navigation";
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
});

export async function createTransaction(_prev, formData) {
  const parsed = newTransaction.safeParse({
    amount: parseAmount(formData.get("amount")) ?? undefined,
    categoryId: formData.get("categoryId") || null,
    description: formData.get("description") ?? "",
    date: formData.get("date"),
    kind: formData.get("fijo") ? "fijo" : "variable",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, categoryId, description, date, kind } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    module: "gastos",
    category_id: categoryId,
    occurred_on: date,
    kind,
    amount_enc: encrypt(amount),
    description_enc: description ? encrypt(description) : null,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect(`/gastos?mes=${date.slice(0, 7)}`);
}

export async function deleteTransaction(formData) {
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error("No se pudo borrar el movimiento.");
  refresh();
}

// Copies last month's fixed expenses into this month, keeping the day (clamped to the month's length).
export async function copyFixedFromPreviousMonth(formData) {
  const target = monthRange(formData.get("mes"));
  const source = monthRange(target.prev);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, occurred_on, amount_enc, description_enc")
    .eq("module", "gastos")
    .eq("kind", "fijo")
    .gte("occurred_on", source.start)
    .lt("occurred_on", source.end);
  if (error) throw new Error("No se pudieron leer los gastos fijos.");

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
    if (insertError) throw new Error("No se pudieron copiar los gastos fijos.");
  }
  refresh();
}

export async function saveBudgets(formData) {
  const supabase = await createClient();
  const updates = [...formData.entries()]
    .filter(([key]) => key.startsWith("budget:"))
    .map(([key, value]) => {
      const id = z.uuid().parse(key.slice("budget:".length));
      const amount = parseAmount(value);
      if (amount != null && amount > MAX_AMOUNT) throw new Error("Presupuesto demasiado grande.");
      return supabase.from("categories").update({ monthly_budget_enc: amount ? encrypt(amount) : null }).eq("id", id);
    });

  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) throw new Error("No se pudieron guardar los presupuestos.");
  redirect("/gastos");
}
