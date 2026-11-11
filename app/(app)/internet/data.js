import { decrypt } from "@/lib/crypto";
import { computeShares } from "@/lib/internet";

// The user's internet plan with decrypted members and their current share, or null if not set up.
// `userId` is for service-role callers (the reminders cron); RLS scopes normal requests.
export async function getPlan(supabase, userId = null) {
  const q = supabase.from("internet_plans").select("id, name, amount_enc, due_day, split_mode, internet_members(id, name_enc, share_enc, is_me, sort)");
  const { data: plan, error } = await (userId ? q.eq("user_id", userId) : q)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const amount = Number(decrypt(plan.amount_enc));
  const members = plan.internet_members
    .toSorted((a, b) => b.is_me - a.is_me || a.sort - b.sort)
    .map((m) => ({ id: m.id, name: decrypt(m.name_enc), isMe: m.is_me, share: m.share_enc ? Number(decrypt(m.share_enc)) : null }));
  const shares = computeShares(amount, members, plan.split_mode);
  members.forEach((m, i) => (m.share = shares[i]));

  return { id: plan.id, name: plan.name, amount, dueDay: plan.due_day, splitMode: plan.split_mode, members };
}
