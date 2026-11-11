import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import CardForm from "./form";

export const metadata = { title: "Tarjeta de crédito" };

export default async function TarjetaPage({ searchParams }) {
  const { id } = await searchParams;
  let card = null;
  if (id) {
    const supabase = await createClient();
    const { data } = await supabase.from("credit_cards").select("id, name_enc, cut_day, pay_day").eq("id", id).maybeSingle();
    if (data) card = { id: data.id, name: decrypt(data.name_enc), cutDay: data.cut_day, payDay: data.pay_day };
  }
  return <CardForm card={card} />;
}
