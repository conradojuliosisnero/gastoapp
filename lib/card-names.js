import { decrypt } from "@/lib/crypto";

// id -> card name, for labelling purchases made with a card.
export async function getCardNames(supabase) {
  const { data, error } = await supabase.from("credit_cards").select("id, name_enc");
  if (error) throw error;
  return new Map(data.map((c) => [c.id, decrypt(c.name_enc)]));
}
