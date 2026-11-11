"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ids = z.array(z.string().min(1).max(200)).max(200);

// Seeing the list marks its alerts as read; the bell then counts only new ones.
export async function markAlertsRead(alertIds) {
  const parsed = ids.safeParse(alertIds);
  if (!parsed.success || !parsed.data.length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_reads")
    .upsert(parsed.data.map((alert_id) => ({ alert_id })), { onConflict: "user_id,alert_id", ignoreDuplicates: true });
  if (error) return { error: "No se pudieron marcar como leídas." };
  refresh();
  return { ok: true };
}
