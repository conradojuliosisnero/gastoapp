// Desktop pass (1280px): sidebar navigation, 2-column screens and sheets as a centered panel.
// Usage: BASE_URL=... E2E_EMAIL=... E2E_PASSWORD=... node e2e/desktop.mjs
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const { BASE_URL, E2E_EMAIL, E2E_PASSWORD, SHOTS = "/tmp/shots" } = process.env;
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, locale: "es-CO" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const v = (l) => l.filter({ visible: true });
const nav = () => v(page.getByRole("navigation", { name: "Navegación principal" }));

let failed = false;
const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed = true;
    await page.screenshot({ path: `${SHOTS}/FALLO-desk-${name.replace(/\W+/g, "_")}.png` });
    console.log(`✗ ${name}\n  ${e.message.split("\n").slice(0, 8).join("\n  ")}`);
  }
};

await step("login", async () => {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("tu@correo.com").fill(E2E_EMAIL);
  await page.getByPlaceholder("Mínimo 8 caracteres").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/inicio/);
});

await step("barra lateral visible y barra inferior oculta", async () => {
  assert.equal(await nav().count(), 1);
  const box = await nav().boundingBox();
  assert.ok(box.x < 260 && box.height > 150, `la navegación debe ser lateral: ${JSON.stringify(box)}`);
  await v(page.getByRole("link", { name: "Nuevo gasto" })).waitFor();
});

for (const [tab, check] of [
  ["Inicio", "Resumen"],
  ["Gastos", "Movimientos"],
  ["Internet", "Internet compartido"],
  ["Juegos", "Compras"],
  ["Tarjetas", "Tarjetas de crédito"],
]) {
  await step(`pantalla ${tab} en escritorio`, async () => {
    await nav().getByRole("link", { name: tab, exact: true }).click();
    await page.getByRole("heading", { name: check }).first().waitFor({ state: "attached" });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, "no debe haber scroll horizontal");
    await page.screenshot({ path: `${SHOTS}/desk-${tab}.png`, fullPage: true });
  });
}

await step("resumen del año en escritorio", async () => {
  await v(page.getByRole("link", { name: "Resumen del año" })).click();
  await page.getByRole("heading", { name: "Suscripciones" }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/desk-anual.png`, fullPage: true });
});

await step("hoja como panel centrado", async () => {
  await v(page.getByRole("link", { name: "Nuevo gasto" })).click();
  await page.getByRole("heading", { name: "Nuevo gasto" }).waitFor();
  const box = await page.getByRole("heading", { name: "Nuevo gasto" }).boundingBox();
  assert.ok(box.x > 400 && box.x < 880, `el título debe quedar centrado: ${box.x}`);
  await page.screenshot({ path: `${SHOTS}/desk-nuevo-gasto.png`, fullPage: true });
  await page.getByRole("link", { name: "Cancelar" }).click();
});

await step("ajustes con recordatorios", async () => {
  await page.goto(`${BASE_URL}/ajustes`);
  await page.getByRole("heading", { name: "Recordatorios" }).waitFor();
  await page.getByRole("switch", { name: /Notificaciones push/ }).waitFor({ state: "attached" });
  await page.getByRole("switch", { name: /Correo/ }).waitFor({ state: "attached" });
  await page.screenshot({ path: `${SHOTS}/desk-ajustes.png`, fullPage: true });
});

await step("sin errores de JavaScript", async () => assert.deepEqual(errors, []));
await browser.close();
console.log(failed ? "HUBO FALLOS" : "TODO OK");
process.exit(failed ? 1 : 0);
