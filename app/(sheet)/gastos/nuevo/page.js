import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { decrypt } from "@/lib/crypto";
import { today } from "@/lib/money";
import NewExpenseForm from "./form";

export const metadata = { title: "Nuevo gasto" };

export default async function NuevoGastoPage() {
  const supabase = await createClient();
  const { data: cardRows } = await supabase.from("credit_cards").select("id, name_enc, cut_day, pay_day").order("created_at");
  const cards = (cardRows ?? []).map((c) => ({ id: c.id, name: decrypt(c.name_enc), cutDay: c.cut_day, payDay: c.pay_day }));
  const categories = await getCategories(supabase, "gastos");
  return <NewExpenseForm categories={categories.map(({ id, name }) => ({ id, name }))} defaultDate={today()} cards={cards} />;
}
