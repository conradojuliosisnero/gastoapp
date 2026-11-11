import { clientFromBearer, unauthorized } from "@/lib/supabase/bearer";
import { decrypt } from "@/lib/crypto";
import { getUsdRate } from "@/lib/fx";
import { today } from "@/lib/money";
import { COLUMNS, fromRow, subscriptionInput, toRow, withYearly } from "@/lib/subscription-store";

// SubTrack extension API. Money is in minor units: COP pesos, USD cents.
export async function GET(request) {
  const auth = await clientFromBearer(request);
  if (!auth) return unauthorized();
  const [subs, cards, usdRate] = await Promise.all([
    auth.supabase.from("subscriptions").select(COLUMNS).order("created_at"),
    auth.supabase.from("credit_cards").select("id, name_enc").order("created_at"),
    getUsdRate(),
  ]);
  if (subs.error || cards.error) return Response.json({ error: "No se pudieron leer tus suscripciones." }, { status: 500 });
  const todayDate = today();
  return Response.json({
    today: todayDate,
    usdRate,
    subscriptions: subs.data.map((r) => withYearly(fromRow(r), todayDate)),
    cards: cards.data.map((c) => ({ id: c.id, name: decrypt(c.name_enc) })),
  });
}

export async function POST(request) {
  const auth = await clientFromBearer(request);
  if (!auth) return unauthorized();
  const body = await request.json().catch(() => null);
  const parsed = subscriptionInput.safeParse({ source: null, renewsOn: null, cardId: null, annual: null, monthly: null, ...body });
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { data, error } = await auth.supabase.from("subscriptions").insert(toRow(parsed.data)).select(COLUMNS).single();
  if (error) return Response.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  return Response.json({ subscription: withYearly(fromRow(data), today()) }, { status: 201 });
}
