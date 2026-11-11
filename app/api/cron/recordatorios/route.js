import { createAdminClient } from "@/lib/supabase/admin";
import { getAlerts } from "@/lib/alerts";
import { appUrl, digest } from "@/lib/reminders";
import { pushConfigured, sendPush } from "@/lib/push";
import { emailConfigured, sendEmail } from "@/lib/email";

// Daily reminders (vercel.json cron, 8:00 Bogotá). Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("No autorizado", { status: 401 });
  if (!process.env.SUPABASE_SECRET_KEY) return Response.json({ error: "Falta SUPABASE_SECRET_KEY" }, { status: 500 });

  const admin = createAdminClient();
  const { data: prefs, error } = await admin.from("notification_prefs").select("user_id, push, email").or("push.eq.true,email.eq.true");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const report = { users: prefs.length, pushes: 0, emails: 0, failed: 0 };
  for (const p of prefs) {
    try {
      const d = digest(await getAlerts(admin, p.user_id), appUrl());
      if (!d) continue;
      if (p.push && pushConfigured()) {
        const { data: rows } = await admin.from("push_subscriptions").select("id, endpoint, keys_enc").eq("user_id", p.user_id);
        report.pushes += await sendPush(admin, rows ?? [], { title: d.title, body: d.body, url: d.url, tag: "recordatorio" });
      }
      if (p.email && emailConfigured()) {
        const { data } = await admin.auth.admin.getUserById(p.user_id);
        if (data?.user?.email) {
          await sendEmail({ to: data.user.email, subject: d.title, html: d.html, text: d.text });
          report.emails++;
        }
      }
    } catch (e) {
      report.failed++;
      console.error("recordatorio", p.user_id, e);
    }
  }
  return Response.json(report);
}
