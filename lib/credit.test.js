import { test } from "node:test";
import assert from "node:assert/strict";
import { dayIn, installments, paymentDate, statementPeriod } from "./credit.js";

const card = { cutDay: 15, payDay: 30 }; // corte 15, paga 30 del mismo mes
const late = { cutDay: 25, payDay: 10 }; // corte 25, paga el 10 del mes siguiente

test("el corte decide el extracto", () => {
  assert.equal(statementPeriod("2026-11-15", 15), "2026-11");
  assert.equal(statementPeriod("2026-11-16", 15), "2026-12");
  assert.equal(statementPeriod("2026-12-20", 15), "2027-01");
});

test("fecha de pago: mismo mes o el siguiente, ajustada a meses cortos", () => {
  assert.equal(paymentDate("2027-02", 15, 30), "2027-02-28");
  assert.equal(paymentDate("2026-11", 25, 10), "2026-12-10");
  assert.equal(dayIn("2028-02", 31), "2028-02-29");
});

test("cuotas: reparto exacto y meses consecutivos", () => {
  const q = installments({ date: "2026-11-20", amount: 1000000, count: 3 }, card);
  assert.deepEqual(q.map((c) => [c.n, c.date, c.amount]), [
    [1, "2026-12-30", 333334],
    [2, "2027-01-30", 333333],
    [3, "2027-02-28", 333333],
  ]);
  assert.equal(q.reduce((s, c) => s + c.amount, 0), 1000000);
  const one = installments({ date: "2026-11-25", amount: 50000 }, late);
  assert.deepEqual(one, [{ n: 1, of: 1, date: "2026-12-10", amount: 50000 }]);
});
