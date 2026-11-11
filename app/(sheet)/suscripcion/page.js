import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { COLUMNS, fromRow } from "@/lib/subscription-store";
import SubscriptionForm from "./form";

export const metadata = { title: "Suscripción" };

export default async function SuscripcionPage({ searchParams }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: cards }] = await Promise.all([
    id ? supabase.from("subscriptions").select(COLUMNS).eq("id", id).maybeSingle() : { data: null },
    supabase.from("credit_cards").select("id, name_enc").order("created_at"),
  ]);
  return <SubscriptionForm sub={data ? fromRow(data) : null} cards={(cards ?? []).map((c) => ({ id: c.id, name: decrypt(c.name_enc) }))} />;
}
