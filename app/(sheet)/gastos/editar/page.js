import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories";
import { decrypt } from "@/lib/crypto";
import { getUsdRate } from "@/lib/fx";
import { today } from "@/lib/money";
import NewExpenseForm from "../nuevo/form";

export const metadata = { title: "Editar" };

// Edits an expense or a game purchase, prefilled; the same form as "Nuevo".
export default async function EditarPage({ searchParams }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const { data: t } = await supabase
    .from("transactions")
    .select("id, module, category_id, occurred_on, amount_enc, description_enc, kind, platform, currency, original_amount_enc, card_id, installments")
    .eq("id", /^[0-9a-f-]{36}$/i.test(id ?? "") ? id : "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  if (!t) notFound();

  const [categories, { data: cardRows }, usdRate] = await Promise.all([
    getCategories(supabase, t.module),
    supabase.from("credit_cards").select("id, name_enc, cut_day, pay_day").order("created_at"),
    t.module === "juegos" ? getUsdRate() : null,
  ]);
  const tx = {
    id: t.id,
    categoryId: t.category_id,
    date: t.occurred_on,
    amount: Number(decrypt(t.amount_enc)),
    usd: t.original_amount_enc ? Number(decrypt(t.original_amount_enc)) : null,
    currency: t.currency,
    description: t.description_enc ? decrypt(t.description_enc) : "",
    kind: t.kind,
    platform: t.platform ?? "Otra",
    cardId: t.card_id ?? "",
    installments: t.installments ?? 1,
  };
  return (
    <NewExpenseForm
      module={t.module}
      tx={tx}
      categories={categories.map(({ id, name }) => ({ id, name }))}
      cards={(cardRows ?? []).map((c) => ({ id: c.id, name: decrypt(c.name_enc), cutDay: c.cut_day, payDay: c.pay_day }))}
      defaultDate={today()}
      usdRate={usdRate}
    />
  );
}
