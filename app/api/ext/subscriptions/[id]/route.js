import { z } from "zod";
import { clientFromBearer, unauthorized } from "@/lib/supabase/bearer";
import { today } from "@/lib/money";
import { COLUMNS, fromRow, subscriptionInput, toRow, withYearly } from "@/lib/subscription-store";

const notFound = () => Response.json({ error: "Suscripción no encontrada." }, { status: 404 });

// Partial update: send only the fields that change.
export async function PATCH(request, { params }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return notFound();
  const auth = await clientFromBearer(request);
  if (!auth) return unauthorized();
  const { data: current } = await auth.supabase.from("subscriptions").select(COLUMNS).eq("id", id).maybeSingle();
  if (!current) return notFound();
  const body = await request.json().catch(() => null);
  const { id: _ignored, updatedAt: _u, ...existing } = fromRow(current);
  const parsed = subscriptionInput.safeParse({ ...existing, ...body });
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { data, error } = await auth.supabase.from("subscriptions").update(toRow(parsed.data)).eq("id", id).select(COLUMNS).single();
  if (error) return Response.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  return Response.json({ subscription: withYearly(fromRow(data), today()) });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return notFound();
  const auth = await clientFromBearer(request);
  if (!auth) return unauthorized();
  const { data, error } = await auth.supabase.from("subscriptions").delete().eq("id", id).select("id");
  if (error) return Response.json({ error: "No se pudo borrar." }, { status: 500 });
  return data.length ? new Response(null, { status: 204 }) : notFound();
}
