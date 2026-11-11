import { z } from "zod";
import { decrypt, encrypt } from "./crypto.js";
import { addMonths, dayIn } from "./credit.js";
import { compare } from "./subscriptions.js";

// One place that validates, encrypts and decrypts subscriptions, shared by the PWA forms and the extension API.

export const COLUMNS = "id, name_enc, currency, monthly_enc, annual_enc, billing, source_enc, renews_on, card_id, updated_at";
const MAX = 1_000_000_000_000;
const price = z.number().int().positive().max(MAX).nullable();

export const subscriptionInput = z
  .object({
    name: z.string().trim().min(1, "Escribe el nombre.").max(40, "Máximo 40 caracteres."),
    currency: z.enum(["COP", "USD"]),
    monthly: price, // minor units: pesos, or USD cents
    annual: price,
    billing: z.enum(["mensual", "anual"]),
    source: z.string().trim().max(120, "Máximo 120 caracteres.").nullable(),
    renewsOn: z.iso.date("Fecha de renovación inválida.").nullable(),
    cardId: z.uuid("Tarjeta inválida.").nullable(),
  })
  .refine((s) => s.monthly || s.annual, "Escribe el precio mensual, el anual o ambos.")
  .refine((s) => s.billing !== "anual" || s.annual, "Si la pagas anual, escribe el precio del plan anual.")
  .refine((s) => s.billing !== "mensual" || s.monthly, "Si la pagas mensual, escribe el precio mensual.");

export const toRow = (s) => ({
  name_enc: encrypt(s.name),
  currency: s.currency,
  monthly_enc: s.monthly ? encrypt(s.monthly) : null,
  annual_enc: s.annual ? encrypt(s.annual) : null,
  billing: s.billing,
  source_enc: s.source ? encrypt(s.source) : null,
  renews_on: s.renewsOn,
  card_id: s.cardId,
  updated_at: new Date().toISOString(),
});

export const fromRow = (r) => ({
  id: r.id,
  name: decrypt(r.name_enc),
  currency: r.currency,
  monthly: r.monthly_enc ? Number(decrypt(r.monthly_enc)) : null,
  annual: r.annual_enc ? Number(decrypt(r.annual_enc)) : null,
  billing: r.billing,
  source: r.source_enc ? decrypt(r.source_enc) : null,
  renewsOn: r.renews_on,
  cardId: r.card_id,
  updatedAt: r.updated_at,
});

// The next renewal on or after `today`: a past date rolls forward by its billing period (day clamped to short months).
export function nextRenewal(renewsOn, billing, today) {
  if (!renewsOn) return null;
  const day = Number(renewsOn.slice(8));
  const step = billing === "anual" ? 12 : 1;
  let period = renewsOn.slice(0, 7);
  while (dayIn(period, day) < today) period = addMonths(period, step);
  return dayIn(period, day);
}

// What one renewal charges, in the subscription's own currency.
export const chargeAmount = (s) => (s.billing === "anual" ? s.annual : s.monthly);

// The subscription plus its yearly figures, as the extension API returns it.
export const withYearly = (s, today) => ({ ...s, nextRenewal: nextRenewal(s.renewsOn, s.billing, today), ...compare(s) });
