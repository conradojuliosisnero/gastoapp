import { test } from "node:test";
import assert from "node:assert/strict";
import { computeShares, dueDate } from "./internet.js";

test("partes iguales suman exactamente el total", () => {
  const shares = computeShares(100000, [{}, {}, {}], "equal");
  assert.deepEqual(shares, [33334, 33333, 33333]);
  assert.equal(shares.reduce((a, b) => a + b, 0), 100000);
  assert.deepEqual(computeShares(120000, [{}, {}, {}], "equal"), [40000, 40000, 40000]);
});

test("partes personalizadas usan lo que tiene cada uno", () => {
  assert.deepEqual(computeShares(120000, [{ share: 50000 }, { share: 35000 }, { share: 35000 }], "custom"), [50000, 35000, 35000]);
});

test("el día de vencimiento se ajusta al largo del mes", () => {
  assert.equal(dueDate("2026-02", 31), "2026-02-28");
  assert.equal(dueDate("2028-02", 30), "2028-02-29");
  assert.equal(dueDate("2026-11", 15), "2026-11-15");
});
