import { decrypt } from "@/lib/crypto";
import { installments } from "@/lib/credit";

// The user's cards plus every installment of every card purchase. `userId` is for service-role callers (cron).
export async function getCredit(supabase, userId = null) {
  const own = (q) => (userId ? q.eq("user_id", userId) : q);
  const [cards, purchases] = await Promise.all([
    own(supabase.from("credit_cards").select("id, name_enc, cut_day, pay_day")).order("created_at"),
    // shortcut: loads all card purchases (no paging past 1000 rows); filter by date once histories get long.
    own(supabase.from("transactions").select("id, module, occurred_on, amount_enc, description_enc, card_id, installments").not("card_id", "is", null)).order("occurred_on"),
  ]);
  if (cards.error) throw cards.error;
  if (purchases.error) throw purchases.error;

  const list = cards.data.map((c) => ({ id: c.id, name: decrypt(c.name_enc), cutDay: c.cut_day, payDay: c.pay_day }));
  const byId = new Map(list.map((c) => [c.id, c]));
  const items = purchases.data.map((t) => ({
    id: t.id,
    cardId: t.card_id,
    module: t.module,
    date: t.occurred_on,
    amount: Number(decrypt(t.amount_enc)),
    title: t.description_enc ? decrypt(t.description_enc) : null,
    count: t.installments ?? 1,
  }));
  const cuotas = items.flatMap((p) => installments(p, byId.get(p.cardId)).map((c) => ({ ...c, cardId: p.cardId, purchaseId: p.id, title: p.title })));
  return { cards: list, purchases: items, cuotas };
}
