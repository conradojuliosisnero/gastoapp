import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { today } from "@/lib/money";
import NewExpenseForm from "../../gastos/nuevo/form";

export const metadata = { title: "Nueva compra" };

export default async function NuevaCompraPage() {
  const supabase = await createClient();
  const types = await getCategories(supabase, "juegos");
  return <NewExpenseForm key={types.map((t) => t.id).join()} module="juegos" categories={types.map(({ id, name }) => ({ id, name }))} defaultDate={today()} />;
}
