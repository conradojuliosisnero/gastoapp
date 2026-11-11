import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt } from "./crypto.js";

process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

test("cifra y descifra montos y texto", () => {
  assert.equal(decrypt(encrypt(184300)), "184300");
  assert.equal(decrypt(encrypt("Mercado ñandú")), "Mercado ñandú");
});

test("el mismo valor produce un cifrado distinto cada vez", () => {
  assert.notEqual(encrypt(40000), encrypt(40000));
});

test("rechaza datos alterados", () => {
  const [v, iv, tag, data] = encrypt(120000).split(".");
  const flipped = Buffer.from(data, "base64");
  flipped[0] ^= 1;
  assert.throws(() => decrypt([v, iv, tag, flipped.toString("base64")].join(".")));
});

test("rechaza otra llave", () => {
  const payload = encrypt(5);
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
  assert.throws(() => decrypt(payload));
});

test("exige una llave de 32 bytes", () => {
  process.env.ENCRYPTION_KEY = "corta";
  assert.throws(() => encrypt(1), /32 bytes/);
});
