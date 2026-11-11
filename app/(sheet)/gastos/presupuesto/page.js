import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import BudgetForm from "./form";

export const metadata = { title: "Presupuestos" };

export default async function PresupuestoPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase, "gastos");
  return <BudgetForm categories={categories} />;
}
