import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { today } from "@/lib/money";
import { getUsdRate } from "@/lib/fx";
import NewExpenseForm from "../../gastos/nuevo/form";

export const metadata = { title: "Nueva compra" };

export default async function NuevaCompraPage() {
  const supabase = await createClient();
  const [types, usdRate] = await Promise.all([getCategories(supabase, "juegos"), getUsdRate()]);
  return <NewExpenseForm module="juegos" categories={types.map(({ id, name }) => ({ id, name }))} defaultDate={today()} usdRate={usdRate} />;
}
