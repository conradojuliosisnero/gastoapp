import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSavings } from "./ahorro.js";
import { maskCOP } from "./money.js";

test("el sueldo se arrastra a los meses siguientes y el ahorro se acumula", () => {
  const r = computeSavings({
    incomes: [
      { period: "2026-12", amount: 5000000 },
      { period: "2026-10", amount: 4000000 },
    ],
    expenses: [
      { date: "2026-10-05", amount: 1500000 },
      { date: "2026-11-20", amount: 4200000 },
      { date: "2026-12-01", amount: 1000000 },
      { date: "2026-09-30", amount: 999 }, // before the first salary: ignored
    ],
    currentPeriod: "2027-01",
  });
  assert.deepEqual(
    r.months.map((m) => [m.period, m.income, m.saved]),
    [
      ["2026-10", 4000000, 2500000],
      ["2026-11", 4000000, -200000],
      ["2026-12", 5000000, 4000000],
      ["2027-01", 5000000, 5000000],
    ]
  );
  assert.equal(r.total, 11300000);
  assert.equal(r.current.period, "2027-01");
});

test("sin sueldo no hay ahorro", () => {
  assert.deepEqual(computeSavings({ incomes: [], expenses: [{ date: "2026-11-01", amount: 5 }], currentPeriod: "2026-11" }), {
    months: [],
    total: 0,
    current: null,
  });
});

test("maskCOP deja ver solo el primer dígito", () => {
  assert.equal(maskCOP(4500000).replace(/\s/g, " "), "$ 4.•••.•••");
  assert.doesNotMatch(maskCOP(123456), /[2-6]/);
});
