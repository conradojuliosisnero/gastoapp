"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { getAlerts } from "@/lib/alerts";
import { appUrl, digest, isPushEndpoint } from "@/lib/reminders";
import { pushConfigured, sendPush } from "@/lib/push";
import { emailConfigured, sendEmail } from "@/lib/email";

const subscription = z.object({
  endpoint: z.string().max(1000).refine(isPushEndpoint, "Servicio de notificaciones no reconocido."),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

const setPref = (supabase, patch) =>
  supabase.from("notification_prefs").upsert({ ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

// This device subscribed to push: store it and turn push reminders on.
export async function subscribePush(sub) {
  if (!pushConfigured()) return { error: "Las notificaciones push aún no están configuradas en el servidor." };
  const parsed = subscription.safeParse(sub);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { endpoint, keys } = parsed.data;
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint, keys_enc: encrypt(JSON.stringify(keys)) }, { onConflict: "user_id,endpoint" });
  if (error) return { error: "No se pudo activar en este dispositivo." };
  const { error: prefError } = await setPref(supabase, { push: true });
  return prefError ? { error: "No se pudo guardar la preferencia." } : { ok: true };
}

// Turning push off removes this device; push stays on only if other devices remain.
export async function unsubscribePush(endpoint) {
  const supabase = await createClient();
  if (typeof endpoint === "string") await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true });
  const { error } = await setPref(supabase, { push: (count ?? 0) > 0 });
  return error ? { error: "No se pudo guardar la preferencia." } : { ok: true, push: (count ?? 0) > 0 };
}

export async function setEmailReminders(on) {
  const supabase = await createClient();
  const { error } = await setPref(supabase, { email: on === true });
  return error ? { error: "No se pudo guardar la preferencia." } : { ok: true };
}

async function testPayload(supabase) {
  return (
    digest(await getAlerts(supabase), appUrl()) ?? {
      title: "Subtrack: prueba de recordatorios",
      body: "Todo en orden. Así te llegarán los avisos de pagos y presupuestos.",
      url: "/notificaciones",
      text: "Así te llegarán los avisos de pagos y presupuestos.",
      html: "<p>Así te llegarán los avisos de pagos y presupuestos de Subtrack.</p>",
    }
  );
}

export async function sendTestPush() {
  if (!pushConfigured()) return { error: "Las notificaciones push aún no están configuradas en el servidor." };
  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("push_subscriptions").select("id, endpoint, keys_enc");
  if (error) return { error: "No se pudieron leer tus dispositivos." };
  if (!rows.length) return { error: "Activa las notificaciones en este dispositivo primero." };
  const d = await testPayload(supabase);
  const sent = await sendPush(supabase, rows, { title: d.title, body: d.body, url: d.url, tag: "prueba" });
  return sent ? { ok: true, sent } : { error: "No se pudo entregar. Desactiva y vuelve a activar las notificaciones." };
}

export async function sendTestEmail() {
  if (!emailConfigured()) return { error: "El envío de correos aún no está configurado en el servidor." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const to = data?.claims?.email;
  if (!to) return { error: "Tu cuenta no tiene correo." };
  const d = await testPayload(supabase);
  try {
    await sendEmail({ to, subject: `${d.title} (prueba)`, html: d.html, text: d.text });
    return { ok: true, to };
  } catch (e) {
    console.error(e);
    return { error: "No se pudo enviar el correo. Revisa la configuración de Resend." };
  }
}
