// Checks the SubTrack extension API against a deployed URL, signing in like the extension does.
// Usage: BASE_URL=... SUPABASE_URL=... SUPABASE_KEY=<publishable> E2E_EMAIL=... E2E_PASSWORD=... node e2e/api.mjs
import assert from "node:assert/strict";

const { BASE_URL, SUPABASE_URL, SUPABASE_KEY, E2E_EMAIL, E2E_PASSWORD } = process.env;
const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASSWORD }),
});
const { access_token } = await signIn.json();
assert(access_token, "no se pudo iniciar sesión");
const api = (path, init = {}) =>
  fetch(`${BASE_URL}/api/ext/subscriptions${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json", ...init.headers },
  });

let r = await fetch(`${BASE_URL}/api/ext/subscriptions`);
assert.equal(r.status, 401, "sin token debe responder 401");
r = await fetch(`${BASE_URL}/api/ext/subscriptions`, { headers: { Authorization: "Bearer basura" } });
assert.equal(r.status, 401, "token inválido debe responder 401");
console.log("✓ rechaza sin token o con token inválido");

r = await api("", { method: "POST", body: JSON.stringify({ name: "Netflix e2e", currency: "COP", monthly: 26900, annual: 269000, billing: "mensual", source: "netflix.com", renewsOn: "2026-01-20" }) });
assert.equal(r.status, 201, await r.clone().text());
const { subscription: created } = await r.json();
assert.equal(created.name, "Netflix e2e");
assert.equal(created.best, "anual");
assert.equal(created.saving, 53800);
assert.match(created.nextRenewal, /^\d{4}-\d{2}-20$/);
console.log("✓ crea con costo anual, comparación y próxima renovación", created.nextRenewal);

r = await api("", { method: "POST", body: JSON.stringify({ name: "Sin precio", currency: "COP", billing: "mensual" }) });
assert.equal(r.status, 400);
console.log("✓ valida la entrada:", (await r.json()).error);

r = await api(`/${created.id}`, { method: "PATCH", body: JSON.stringify({ billing: "anual" }) });
assert.equal(r.status, 200, await r.clone().text());
const { subscription: patched } = await r.json();
assert.equal(patched.billing, "anual");
assert.equal(patched.yearCost, 269000);
assert.equal(patched.source, "netflix.com");
console.log("✓ actualiza parcial y conserva el resto");

r = await api("");
const list = await r.json();
assert.ok(list.subscriptions.some((s) => s.id === created.id));
assert.ok(Array.isArray(list.cards));
console.log("✓ lista suscripciones y tarjetas", { total: list.subscriptions.length, usdRate: list.usdRate });

r = await api(`/${created.id}`, { method: "DELETE" });
assert.equal(r.status, 204);
r = await api(`/${created.id}`, { method: "DELETE" });
assert.equal(r.status, 404);
console.log("✓ borra y responde 404 si ya no existe");
console.log("TODO OK");
