"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseMoney } from "@/lib/money";
import { subscriptionInput, toRow } from "@/lib/subscription-store";

export async function saveSubscription(_prev, formData) {
  const id = formData.get("id") || null;
  if (id && !z.uuid().safeParse(id).success) return { error: "Suscripción inválida." };
  const currency = formData.get("currency") === "USD" ? "USD" : "COP";
  const parsed = subscriptionInput.safeParse({
    name: formData.get("name") ?? "",
    currency,
    monthly: parseMoney(formData.get("monthly"), currency) || null,
    annual: parseMoney(formData.get("annual"), currency) || null,
    billing: formData.get("billing"),
    source: formData.get("source") || null,
    renewsOn: formData.get("renewsOn") || null,
    cardId: formData.get("cardId") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const row = toRow(parsed.data);
  const { error } = id ? await supabase.from("subscriptions").update(row).eq("id", id) : await supabase.from("subscriptions").insert(row);
  if (error) return { error: "No se pudo guardar la suscripción." };
  refresh();
  return { ok: true, name: parsed.data.name };
}

export async function deleteSubscription(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Suscripción inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar." };
  refresh();
  return { ok: true };
}
