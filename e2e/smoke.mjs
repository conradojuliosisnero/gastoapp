// End-to-end smoke test against a deployed URL, on a phone-sized Chromium.
// Usage: BASE_URL=https://... E2E_EMAIL=... E2E_PASSWORD=... node e2e/smoke.mjs
// Needs `playwright` installed (not a project dependency on purpose).
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const { BASE_URL, E2E_EMAIL, E2E_PASSWORD, SHOTS = "/tmp/shots" } = process.env;
assert(BASE_URL && E2E_EMAIL && E2E_PASSWORD, "Faltan BASE_URL, E2E_EMAIL o E2E_PASSWORD");
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "es-CO" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    await page.screenshot({ path: `${SHOTS}/FALLO-${name.replace(/\W+/g, "_")}.png`, fullPage: true });
    console.log(`✗ ${name}\n  ${e.message.split("\n")[0]}`);
    await browser.close();
    process.exit(1);
  }
};
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const unique = `Prueba e2e ${Date.now().toString().slice(-5)}`;

await step("sin sesión redirige a login", async () => {
  await page.goto(`${BASE_URL}/gastos`);
  await page.waitForURL(/\/login/);
  await shot("01-login");
});

await step("iniciar sesión", async () => {
  await page.getByPlaceholder("tu@correo.com").fill(E2E_EMAIL);
  await page.getByPlaceholder("Mínimo 8 caracteres").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/inicio/);
  await page.getByRole("heading", { name: "Resumen" }).waitFor();
});

await step("pantalla Gastos con categorías por defecto", async () => {
  await page.getByRole("link", { name: "Gastos" }).click();
  await page.waitForURL(/\/gastos/);
  await page.getByRole("heading", { name: "Por categoría" }).waitFor();
  await page.getByText("Comida", { exact: true }).waitFor();
  await shot("02-gastos-vacio");
});

await step("crear gasto fijo desde el botón +", async () => {
  await page.getByRole("link", { name: "Agregar gasto" }).click();
  await page.waitForURL(/\/gastos\/nuevo/);
  await page.getByPlaceholder("$0").fill("45000");
  assert.equal(await page.getByPlaceholder("$0").inputValue(), "$45.000");
  await page.getByText("Comida", { exact: true }).click();
  await page.getByPlaceholder("Ej. Mercado").fill(unique);
  await page.getByText("Gasto fijo (se repite cada mes)").click();
  await shot("03-nuevo-gasto");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/\/gastos\?mes=/);
  await page.getByText(unique).waitFor();
  assert.match(await page.locator("main, body").first().innerText(), /45\.000/);
});

await step("validación: monto vacío muestra error", async () => {
  await page.goto(`${BASE_URL}/gastos/nuevo`);
  await page.getByPlaceholder("$0").fill("");
  await page.getByPlaceholder("$0").evaluate((el) => el.removeAttribute("required"));
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.getByText("Escribe el monto.").waitFor();
  await page.getByRole("link", { name: "Cancelar" }).click();
  await page.waitForURL(/\/gastos$/);
});

await step("definir presupuesto y ver el resumen", async () => {
  await page.getByRole("link", { name: "Ajustar" }).click();
  await page.waitForURL(/\/gastos\/presupuesto/);
  await page.getByLabel("Comida").fill("40000");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForURL(/\/gastos$/);
  await page.getByText(/Te pasaste/).waitFor();
  await page.getByText(/Excedido por/).waitFor();
  await shot("04-gastos-con-datos");
});

await step("filtros fijos / variables", async () => {
  await page.getByRole("button", { name: "Variables" }).click();
  await page.getByText("No hay movimientos con este filtro.").waitFor();
  await page.getByRole("button", { name: "Fijos" }).click();
  await page.getByText(unique).waitFor();
  await page.getByRole("button", { name: "Todos" }).click();
});

await step("borrar el gasto", async () => {
  await page.getByRole("button", { name: `Borrar ${unique}` }).click();
  await page.getByText(unique).waitFor({ state: "detached" });
});

await step("sin errores de JavaScript en el navegador", async () => {
  assert.deepEqual(errors, []);
});

await step("cerrar sesión", async () => {
  await page.getByRole("link", { name: "Inicio" }).click();
  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL(/\/login/);
});

await browser.close();
console.log("TODO OK");
