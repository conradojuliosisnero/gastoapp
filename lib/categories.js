import { decrypt } from "@/lib/crypto";
import { DEFAULT_CATEGORIES } from "@/lib/gastos";

// Returns the user's categories for a module, creating the defaults on first use.
// With `userId` (service-role client, e.g. the reminders cron) it filters by that user and never seeds.
export async function getCategories(supabase, module, userId = null) {
  const select = () => {
    const q = supabase.from("categories").select("id, name, monthly_budget_enc").eq("module", module);
    return (userId ? q.eq("user_id", userId) : q).order("sort").order("name");
  };

  let { data, error } = await select();
  if (error) throw error;

  if (data.length === 0 && !userId && DEFAULT_CATEGORIES[module]) {
    const rows = DEFAULT_CATEGORIES[module].map((name, sort) => ({ module, name, sort }));
    const { error: seedError } = await supabase.from("categories").upsert(rows, { onConflict: "user_id,module,name", ignoreDuplicates: true });
    if (seedError) throw seedError;
    ({ data, error } = await select());
    if (error) throw error;
  }

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    budget: c.monthly_budget_enc ? Number(decrypt(c.monthly_budget_enc)) : null,
  }));
}
