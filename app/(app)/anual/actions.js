"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { parseMoney } from "@/lib/money";

const MAX = 1_000_000_000_000;
const price = z.number().int().positive().max(MAX).nullable();
const sub = z
  .object({
    id: z.uuid().nullable(),
    name: z.string().trim().min(1, "Escribe el nombre.").max(40, "Máximo 40 caracteres."),
    currency: z.enum(["COP", "USD"]),
    monthly: price,
    annual: price,
    billing: z.enum(["mensual", "anual"]),
  })
  .refine((s) => s.monthly || s.annual, "Escribe el precio mensual, el anual o ambos.")
  .refine((s) => s.billing !== "anual" || s.annual, "Si la pagas anual, escribe el precio del plan anual.")
  .refine((s) => s.billing !== "mensual" || s.monthly, "Si la pagas mensual, escribe el precio mensual.");

export async function saveSubscription(_prev, formData) {
  const currency = formData.get("currency") === "USD" ? "USD" : "COP";
  const parsed = sub.safeParse({
    id: formData.get("id") || null,
    name: formData.get("name") ?? "",
    currency,
    monthly: parseMoney(formData.get("monthly"), currency) || null,
    annual: parseMoney(formData.get("annual"), currency) || null,
    billing: formData.get("billing"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, monthly, annual, billing } = parsed.data;
  const row = { name_enc: encrypt(name), currency, monthly_enc: monthly ? encrypt(monthly) : null, annual_enc: annual ? encrypt(annual) : null, billing };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("subscriptions").update(row).eq("id", id) : await supabase.from("subscriptions").insert(row);
  if (error) return { error: "No se pudo guardar la suscripción." };
  refresh();
  return { ok: true, name };
}

export async function deleteSubscription(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Suscripción inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  refresh();
  return { ok: true };
}
