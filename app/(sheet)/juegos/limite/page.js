import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import LimitForm from "./form";

export const metadata = { title: "Límite mensual" };

export default async function LimitePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("module_limits").select("amount_enc").eq("module", "juegos").maybeSingle();
  return <LimitForm current={data ? Number(decrypt(data.amount_enc)) : null} />;
}
