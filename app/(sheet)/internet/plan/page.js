import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/app/(app)/internet/data";
import PlanForm from "./form";

export const metadata = { title: "Plan de internet" };

export default async function PlanPage() {
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  return <PlanForm plan={plan} />;
}
