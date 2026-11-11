import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import SubscriptionForm from "./form";

export const metadata = { title: "Suscripción" };

export default async function SuscripcionPage({ searchParams }) {
  const { id } = await searchParams;
  let sub = null;
  if (id) {
    const supabase = await createClient();
    const { data } = await supabase.from("subscriptions").select("id, name_enc, currency, monthly_enc, annual_enc, billing").eq("id", id).maybeSingle();
    if (data)
      sub = {
        id: data.id,
        name: decrypt(data.name_enc),
        currency: data.currency,
        monthly: data.monthly_enc ? Number(decrypt(data.monthly_enc)) : null,
        annual: data.annual_enc ? Number(decrypt(data.annual_enc)) : null,
        billing: data.billing,
      };
  }
  return <SubscriptionForm sub={sub} />;
}
