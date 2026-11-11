"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

const day = (label) => z.coerce.number({ error: `Escribe el ${label}.` }).int().min(1, `El ${label} va de 1 a 31.`).max(31, `El ${label} va de 1 a 31.`);
const card = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Ponle un nombre a la tarjeta.").max(40, "Máximo 40 caracteres."),
  cutDay: day("día de corte"),
  payDay: day("día de pago"),
});

export async function saveCard(_prev, formData) {
  const parsed = card.safeParse({
    id: formData.get("id") || null,
    name: formData.get("name") ?? "",
    cutDay: formData.get("cutDay"),
    payDay: formData.get("payDay"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, cutDay, payDay } = parsed.data;
  if (cutDay === payDay) return { error: "El día de pago debe ser distinto al de corte." };

  const supabase = await createClient();
  const row = { name_enc: encrypt(name), cut_day: cutDay, pay_day: payDay };
  const { error } = id ? await supabase.from("credit_cards").update(row).eq("id", id) : await supabase.from("credit_cards").insert(row);
  if (error) return { error: "No se pudo guardar la tarjeta." };
  refresh();
  return { ok: true, name };
}

// Its purchases stay, as if paid in cash (the FK clears card_id).
export async function deleteCard(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Tarjeta inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar la tarjeta." };
  refresh();
  return { ok: true };
}
