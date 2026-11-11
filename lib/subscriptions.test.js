import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, totals } from "./subscriptions.js";

test("plan anual más barato", () => {
  const c = compare({ monthly: 30000, annual: 300000, billing: "mensual" });
  assert.deepEqual(c, { yearCost: 360000, best: "anual", saving: 60000, pct: 17 });
});

test("pagando anual, el costo del año es el plan anual", () => {
  assert.equal(compare({ monthly: 30000, annual: 300000, billing: "anual" }).yearCost, 300000);
});

test("mensual sale mejor o no hay con qué comparar", () => {
  assert.equal(compare({ monthly: 10000, annual: 130000 }).best, "mensual");
  assert.deepEqual(compare({ monthly: 10000 }), { yearCost: 120000, best: null, saving: 0, pct: 0 });
  assert.equal(compare({ annual: 99000, billing: "anual" }).yearCost, 99000);
});

test("totales en pesos y ahorro posible", () => {
  const toCop = (n, cur) => (cur === "USD" ? Math.round((n / 100) * 4000) : n);
  const t = totals(
    [
      { monthly: 30000, annual: 300000, billing: "mensual", currency: "COP" }, // 360k, could save 60k
      { monthly: 1000, annual: 10000, billing: "anual", currency: "USD" }, // US$100 = 400k, already best
      { monthly: 20000, billing: "mensual", currency: "COP" }, // 240k
    ],
    toCop
  );
  assert.deepEqual(t, { year: 1000000, month: 83333, potential: 60000 });
});
