"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { parseAmount } from "@/lib/money";

const MAX = 1_000_000_000_000;

export async function saveGamesLimit(_prev, formData) {
  const amount = parseAmount(formData.get("amount"));
  if (amount != null && amount > MAX) return { error: "Monto demasiado grande." };
  const supabase = await createClient();
  const { error } = amount
    ? await supabase.from("module_limits").upsert({ module: "juegos", amount_enc: encrypt(amount), updated_at: new Date().toISOString() }, { onConflict: "user_id,module" })
    : await supabase.from("module_limits").delete().eq("module", "juegos");
  if (error) return { error: "No se pudo guardar el límite." };
  refresh();
  return { ok: true, cleared: !amount };
}

const wish = z.object({
  title: z.string().trim().min(1, "Escribe el nombre del juego.").max(80, "Nombre muy largo."),
  platform: z.enum(["PS5", "PC", "Otra"]),
  current: z.number().int().positive("Escribe el precio actual.").max(MAX),
  target: z.number().int().positive().max(MAX).nullable(),
});

export async function createWish(_prev, formData) {
  const parsed = wish.safeParse({
    title: formData.get("title") ?? "",
    platform: formData.get("platform"),
    current: parseAmount(formData.get("current")) ?? 0,
    target: parseAmount(formData.get("target")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { title, platform, current, target } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("wishlist").insert({
    title,
    platform,
    current_price_enc: encrypt(current),
    target_price_enc: target ? encrypt(target) : null,
  });
  if (error) return { error: "No se pudo guardar el juego." };
  refresh();
  return { ok: true };
}

export async function deleteWish(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Juego inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("wishlist").delete().eq("id", id);
  if (error) return { error: "No se pudo quitar el juego." };
  refresh();
  return { ok: true };
}
