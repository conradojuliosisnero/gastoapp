import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { today } from "@/lib/money";
import NewExpenseForm from "./form";

export const metadata = { title: "Nuevo gasto" };

export default async function NuevoGastoPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase, "gastos");
  return <NewExpenseForm categories={categories.map(({ id, name }) => ({ id, name }))} defaultDate={today()} />;
}
