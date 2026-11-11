import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { decrypt } from "@/lib/crypto";
import { today } from "@/lib/money";
import { getUsdRate } from "@/lib/fx";
import NewExpenseForm from "../../gastos/nuevo/form";

export const metadata = { title: "Nueva compra" };

export default async function NuevaCompraPage() {
  const supabase = await createClient();
  const { data: cardRows } = await supabase.from("credit_cards").select("id, name_enc, cut_day, pay_day").order("created_at");
  const cards = (cardRows ?? []).map((c) => ({ id: c.id, name: decrypt(c.name_enc), cutDay: c.cut_day, payDay: c.pay_day }));
  const [types, usdRate] = await Promise.all([getCategories(supabase, "juegos"), getUsdRate()]);
  return <NewExpenseForm module="juegos" categories={types.map(({ id, name }) => ({ id, name }))} defaultDate={today()} cards={cards} usdRate={usdRate} />;
}
