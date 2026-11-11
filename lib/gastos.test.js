import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./gastos.js";
import { parseAmount, monthRange } from "./money.js";

test("resumen por categoría con presupuesto excedido y sin categoría", () => {
  const cats = [
    { id: "a", name: "Comida", budget: 700000 },
    { id: "b", name: "Ocio", budget: 100000 },
    { id: "c", name: "Salud", budget: null },
  ];
  const txs = [
    { categoryId: "a", amount: 184300, date: "2026-11-02" },
    { categoryId: "a", amount: 435700, date: "2026-11-11" },
    { categoryId: "b", amount: 120000, date: "2026-11-05" },
    { categoryId: null, amount: 5000, date: "2026-11-01" },
  ];
  const s = summarize(cats, txs, "2026-11-11");
  assert.equal(s.total, 745000);
  assert.equal(s.budget, 800000);
  assert.equal(s.uncategorized, 5000);
  assert.deepEqual(s.rows.map((r) => [r.spent, r.over]), [[620000, false], [120000, true], [0, false]]);
});

test("los pagos futuros no cuentan como gastados ni en el presupuesto", () => {
  const cats = [{ id: "a", name: "Vivienda", budget: 900000 }];
  const txs = [
    { categoryId: "a", amount: 900000, date: "2026-11-30" },
    { categoryId: "a", amount: 50000, date: "2026-11-11" },
    { categoryId: "a", amount: 70000, date: "2026-11-12" },
  ];
  const s = summarize(cats, txs, "2026-11-11");
  assert.equal(s.total, 50000);
  assert.equal(s.upcoming, 970000);
  assert.equal(s.upcomingCount, 2);
  assert.equal(s.rows[0].spent, 50000);
  assert.equal(s.rows[0].over, false);
});

test("parseAmount acepta formatos comunes y rechaza vacío", () => {
  assert.equal(parseAmount("45.000"), 45000);
  assert.equal(parseAmount("$ 1.250.000"), 1250000);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount(null), null);
});

test("monthRange calcula límites y cruza de año", () => {
  const dic = monthRange("2026-12");
  assert.equal(dic.start, "2026-12-01");
  assert.equal(dic.end, "2027-01-01");
  assert.equal(dic.prev, "2026-11");
  assert.equal(dic.label, "Diciembre de 2026");
  assert.equal(monthRange("2027-01").prev, "2026-12");
  assert.match(monthRange("basura").key, /^\d{4}-\d{2}$/);
});
