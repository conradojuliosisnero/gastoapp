import { test } from "node:test";
import assert from "node:assert/strict";
import { nextRenewal, subscriptionInput } from "./subscription-store.js";

test("la próxima renovación avanza por mes o por año", () => {
  assert.equal(nextRenewal("2026-11-20", "mensual", "2026-11-11"), "2026-11-20");
  assert.equal(nextRenewal("2026-09-05", "mensual", "2026-11-11"), "2026-12-05");
  assert.equal(nextRenewal("2026-01-31", "mensual", "2026-02-10"), "2026-02-28");
  assert.equal(nextRenewal("2025-03-01", "anual", "2026-11-11"), "2027-03-01");
  assert.equal(nextRenewal(null, "mensual", "2026-11-11"), null);
});

test("validación de entrada", () => {
  const ok = subscriptionInput.safeParse({ name: "Netflix", currency: "COP", monthly: 26900, annual: null, billing: "mensual", source: "netflix.com", renewsOn: "2026-11-20", cardId: null });
  assert.ok(ok.success);
  const bad = subscriptionInput.safeParse({ name: "X", currency: "COP", monthly: null, annual: null, billing: "mensual", source: null, renewsOn: null, cardId: null });
  assert.equal(bad.success, false);
});
