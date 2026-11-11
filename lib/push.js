import { sendNotification, setVapidDetails } from "web-push";
import { decrypt } from "@/lib/crypto";
import { appUrl } from "@/lib/reminders";

export const pushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// Sends one notification to each subscription row ({ id, endpoint, keys_enc }). Expired devices are removed.
export async function sendPush(supabase, rows, payload) {
  setVapidDetails(appUrl(), process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  let sent = 0;
  await Promise.all(
    rows.map(async (row) => {
      try {
        await sendNotification({ endpoint: row.endpoint, keys: JSON.parse(decrypt(row.keys_enc)) }, JSON.stringify(payload), { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await supabase.from("push_subscriptions").delete().eq("id", row.id);
        else console.error("push", e.statusCode, e.body);
      }
    })
  );
  return sent;
}
