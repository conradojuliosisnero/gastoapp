import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only, for the reminders cron. Always filter by user_id.
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
