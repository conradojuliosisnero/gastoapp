import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/app/(app)/internet/data";
import PersonForm from "./form";

export const metadata = { title: "Persona" };

// Add (no id) or edit (?id=) one person of the internet plan.
export default async function PersonaPage({ searchParams }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  if (!plan) redirect("/internet/plan");
  const member = id ? plan.members.find((m) => m.id === id) : null;
  if (id && !member) redirect("/internet");
  const othersTotal = plan.members.filter((m) => m.id !== id).reduce((s, m) => s + m.share, 0);
  return (
    <PersonForm
      member={member}
      splitMode={plan.splitMode}
      planAmount={plan.amount}
      othersTotal={othersTotal}
      count={plan.members.length}
    />
  );
}
