"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "@/lib/crypto";
import { formatCOP, monthRange, parseAmount } from "@/lib/money";

const salary = z.object({
  amount: z.number({ error: "Escribe tu sueldo." }).int().positive("El sueldo debe ser mayor a cero.").max(1_000_000_000_000, "Monto demasiado grande."),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mes inválido."),
});

export async function saveSalary(_prev, formData) {
  const parsed = salary.safeParse({ amount: parseAmount(formData.get("amount")) ?? undefined, period: formData.get("period") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("incomes")
    .upsert({ period: parsed.data.period, amount_enc: encrypt(parsed.data.amount), updated_at: new Date().toISOString() }, { onConflict: "user_id,period" });
  if (error) return { error: "No se pudo guardar el sueldo." };

  refresh();
  return { ok: true };
}

// The salary is only sent to the browser when the user explicitly asks to see it.
export async function revealSalary() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incomes")
    .select("amount_enc")
    .lte("period", monthRange().key)
    .order("period", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return { error: "No se pudo mostrar el sueldo." };
  return { value: formatCOP(Number(decrypt(data.amount_enc))) };
}
