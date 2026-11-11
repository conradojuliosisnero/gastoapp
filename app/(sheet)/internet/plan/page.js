import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/app/(app)/internet/data";
import PlanForm from "./form";

export const metadata = { title: "Plan de internet" };

export default async function PlanPage() {
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  // New key when the saved plan changes, so a screen Next kept in memory never reopens with old data.
  return <PlanForm key={plan ? plan.members.map((m) => `${m.id}:${m.share}`).join() + plan.amount + plan.splitMode : "nuevo"} plan={plan} />;
}
