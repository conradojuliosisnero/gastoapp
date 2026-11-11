import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, parseUSD, typingMoney, usdToCop } from "./money.js";

test("parseUSD lee dólares con coma o punto y devuelve centavos", () => {
  assert.equal(parseUSD("69.99"), 6999);
  assert.equal(parseUSD("69,99"), 6999);
  assert.equal(parseUSD("US$ 70"), 7000);
  assert.equal(parseUSD("1,299.5"), 129950);
  assert.equal(parseUSD("1.299"), 129900);
  assert.equal(parseUSD(".5"), 50);
  assert.equal(parseUSD(""), null);
  assert.equal(parseUSD("abc"), null);
});

test("typingMoney agrupa pesos y limita dólares a 2 decimales", () => {
  assert.equal(typingMoney("45000"), "45.000");
  assert.equal(typingMoney("$45.000"), "45.000");
  assert.equal(typingMoney("69,999", "USD"), "69.99");
  assert.equal(typingMoney("69.", "USD"), "69.");
  assert.equal(typingMoney("", "USD"), "");
});

test("conversión y formato", () => {
  assert.equal(usdToCop(6999, 4000.5), 279995);
  assert.equal(formatMoney(6999, "USD").replace(/\s/g, " "), "US$ 69,99");
  assert.equal(formatMoney(280000).replace(/\s/g, " "), "$ 280.000");
});
