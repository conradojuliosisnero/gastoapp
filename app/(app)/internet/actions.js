"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { dueDate } from "@/lib/internet";
import { monthRange, parseAmount, today } from "@/lib/money";
import { getPlan } from "./data";

const MAX = 1_000_000_000_000;
const MAX_PEOPLE = 12;

const planSchema = z
  .object({
    name: z.string().trim().min(1, "Ponle un nombre al plan.").max(60, "Nombre muy largo."),
    amount: z.number({ error: "Escribe el valor mensual." }).int().positive("El valor debe ser mayor a cero.").max(MAX),
    dueDay: z.coerce.number().int().min(1, "Día inválido.").max(31, "Día inválido."),
    splitMode: z.enum(["equal", "custom"]),
    members: z
      .array(
        z.object({
          id: z.uuid().nullable(),
          name: z.string().trim().min(1, "Cada integrante necesita un nombre.").max(40, "Nombre muy largo."),
          isMe: z.boolean(),
          share: z.number().int().nonnegative().max(MAX).nullable(),
        })
      )
      .min(2, "Agrega al menos otra persona.")
      .max(MAX_PEOPLE, `Máximo ${MAX_PEOPLE} personas.`),
  })
  .refine((p) => p.splitMode === "equal" || p.members.reduce((s, m) => s + (m.share ?? 0), 0) === p.amount, {
    message: "En personalizado, las partes deben sumar el valor del plan.",
  });

export async function savePlan(_prev, formData) {
  const count = Number(formData.get("memberCount"));
  const members = Array.from({ length: Number.isInteger(count) && count < 20 ? count : 0 }, (_, i) => ({
    id: formData.get(`member:${i}:id`) || null,
    name: formData.get(`member:${i}:name`) ?? "",
    isMe: i === 0,
    share: parseAmount(formData.get(`member:${i}:share`)),
  }));
  const parsed = planSchema.safeParse({
    name: formData.get("name") ?? "",
    amount: parseAmount(formData.get("amount")) ?? undefined,
    dueDay: formData.get("dueDay"),
    splitMode: formData.get("splitMode"),
    members,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const existing = await getPlan(supabase);
  const planRow = { name: p.name, amount_enc: encrypt(p.amount), due_day: p.dueDay, split_mode: p.splitMode };
  const { data: plan, error } = existing
    ? await supabase.from("internet_plans").update(planRow).eq("id", existing.id).select("id").single()
    : await supabase.from("internet_plans").insert(planRow).select("id").single();
  if (error) return { error: "No se pudo guardar el plan." };

  // Only members the user explicitly removed are deleted (their payment history goes with them).
  const requested = String(formData.get("removed") ?? "").split(",").filter(Boolean);
  const keepIds = new Set(p.members.map((m) => m.id).filter(Boolean));
  const removed = (existing?.members ?? []).map((m) => m.id).filter((id) => requested.includes(id) && !keepIds.has(id));
  if (removed.length) {
    const { error: delError } = await supabase.from("internet_members").delete().in("id", removed);
    if (delError) return { error: "No se pudo quitar a un integrante." };
  }

  const rows = p.members.map((m, sort) => ({
    ...(m.id ? { id: m.id } : {}),
    plan_id: plan.id,
    name_enc: encrypt(m.name),
    share_enc: p.splitMode === "custom" ? encrypt(m.share ?? 0) : null,
    is_me: m.isMe,
    sort,
  }));
  const updates = rows.filter((r) => r.id);
  const inserts = rows.filter((r) => !r.id);
  const results = await Promise.all([
    ...updates.map(({ id, ...r }) => supabase.from("internet_members").update(r).eq("id", id)),
    inserts.length ? supabase.from("internet_members").insert(inserts) : { error: null },
  ]);
  if (results.some((r) => r.error)) return { error: "No se pudieron guardar los integrantes." };

  refresh();
  return { ok: true };
}

// Marks or unmarks a member's payment for a month. Your own share is also recorded as an expense.
export async function togglePayment(memberId, period) {
  if (!z.uuid().safeParse(memberId).success || monthRange(period).key !== period) return { error: "Datos inválidos." };
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  const member = plan?.members.find((m) => m.id === memberId);
  if (!member) return { error: "Integrante no encontrado." };

  const { data: existing, error: readError } = await supabase
    .from("internet_payments")
    .select("id, transaction_id")
    .eq("member_id", memberId)
    .eq("period", period)
    .maybeSingle();
  if (readError) return { error: "No se pudo leer el pago." };

  if (existing) {
    const { error } = await supabase.from("internet_payments").delete().eq("id", existing.id);
    if (error) return { error: "No se pudo desmarcar el pago." };
    if (existing.transaction_id) await supabase.from("transactions").delete().eq("id", existing.transaction_id);
    refresh();
    return { ok: true, paid: false, name: member.name };
  }

  let transactionId = null;
  if (member.isMe) {
    const todayDate = today();
    const { data: servicios } = await supabase.from("categories").select("id").eq("module", "gastos").eq("name", "Servicios").maybeSingle();
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        module: "gastos",
        kind: "fijo",
        category_id: servicios?.id ?? null,
        occurred_on: period === todayDate.slice(0, 7) ? todayDate : dueDate(period, plan.dueDay),
        amount_enc: encrypt(member.share),
        description_enc: encrypt(`Internet · ${plan.name} (tu parte)`),
      })
      .select("id")
      .single();
    if (txError) return { error: "No se pudo registrar tu parte como gasto." };
    transactionId = tx.id;
  }

  const { error } = await supabase
    .from("internet_payments")
    .insert({ member_id: memberId, period, amount_enc: encrypt(member.share), transaction_id: transactionId });
  if (error) {
    if (transactionId) await supabase.from("transactions").delete().eq("id", transactionId);
    return { error: "No se pudo marcar el pago." };
  }
  refresh();
  return { ok: true, paid: true, name: member.name };
}

const person = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Escribe el nombre.").max(40, "Nombre muy largo."),
  share: z.number().int().nonnegative().max(MAX).nullable(),
});

// Adds a person to the plan, or renames them / changes their custom share. Payments history is kept.
export async function savePerson(_prev, formData) {
  const parsed = person.safeParse({
    id: formData.get("id") || null,
    name: formData.get("name") ?? "",
    share: parseAmount(formData.get("share")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, share } = parsed.data;

  const supabase = await createClient();
  const plan = await getPlan(supabase);
  if (!plan) return { error: "Primero configura el plan." };
  const shareEnc = plan.splitMode === "custom" ? encrypt(share ?? 0) : null;

  if (id) {
    if (!plan.members.some((m) => m.id === id)) return { error: "Persona no encontrada." };
    const { error } = await supabase.from("internet_members").update({ name_enc: encrypt(name), share_enc: shareEnc }).eq("id", id);
    if (error) return { error: "No se pudo guardar." };
  } else {
    if (plan.members.length >= MAX_PEOPLE) return { error: `Máximo ${MAX_PEOPLE} personas.` };
    const { error } = await supabase
      .from("internet_members")
      .insert({ plan_id: plan.id, name_enc: encrypt(name), share_enc: shareEnc, is_me: false, sort: plan.members.length });
    if (error) return { error: "No se pudo agregar." };
  }
  refresh();
  return { ok: true, name, created: !id };
}

// Removes a person and their payment history. You can't remove yourself or the last other person.
export async function deletePerson(id) {
  if (!z.uuid().safeParse(id).success) return { error: "Persona inválida." };
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  const member = plan?.members.find((m) => m.id === id);
  if (!member) return { error: "Persona no encontrada." };
  if (member.isMe) return { error: "No puedes quitarte del plan." };
  if (plan.members.length <= 2) return { error: "El plan necesita al menos otra persona. Si ya no lo compartes, borra el plan." };
  const { error } = await supabase.from("internet_members").delete().eq("id", id);
  if (error) return { error: "No se pudo quitar." };
  refresh();
  return { ok: true, name: member.name };
}

// Deletes the plan with its people and payment history. Your own shares already recorded stay in Gastos.
export async function deletePlan() {
  const supabase = await createClient();
  const plan = await getPlan(supabase);
  if (!plan) return { ok: true };
  const { error } = await supabase.from("internet_plans").delete().eq("id", plan.id);
  if (error) return { error: "No se pudo borrar el plan." };
  refresh();
  return { ok: true };
}
