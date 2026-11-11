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
page.on("dialog", (d) => errors.push(`diálogo nativo inesperado: ${d.message()}`) && d.dismiss());

// Next keeps previous screens mounted but hidden (instant back navigation), so only look at what is visible.
const v = (locator) => locator.filter({ visible: true });
const text = (t, opts) => v(page.getByText(t, opts));
const role = (r, opts) => v(page.getByRole(r, opts));
const toastSays = (t) => page.getByRole("status").getByText(t).waitFor();
// Confirms through the app's own modal (never the browser's confirm()).
async function confirmModal(button) {
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog.getByRole("button", { name: button }).click();
  await dialog.waitFor({ state: "hidden" });
}

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
const unique = `Prueba e2e ${Date.now().toString().slice(-5)}`;

await step("sin sesión redirige a login", async () => {
  await page.goto(`${BASE_URL}/gastos`);
  await page.waitForURL(/\/login/);
});

await step("iniciar sesión", async () => {
  await v(page.getByPlaceholder("tu@correo.com")).fill(E2E_EMAIL);
  await v(page.getByPlaceholder("Mínimo 8 caracteres")).fill(E2E_PASSWORD);
  await role("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/inicio/);
  await role("heading", { name: "Resumen" }).waitFor();
});

await step("pantalla Gastos con categorías por defecto", async () => {
  await role("link", { name: "Gastos" }).click();
  await role("heading", { name: "Por categoría" }).waitFor();
  await text("Comida", { exact: true }).waitFor();
});

await step("crear gasto fijo desde el botón +", async () => {
  await role("link", { name: "Agregar gasto" }).click();
  await role("heading", { name: "Nuevo gasto" }).waitFor();
  const amount = v(page.getByPlaceholder("$0"));
  await amount.fill("45000");
  assert.equal(await amount.inputValue(), "$45.000");
  await text("Comida", { exact: true }).click();
  await v(page.getByPlaceholder("Ej. Mercado")).fill(unique);
  await text("Gasto fijo (se repite cada mes)").click();
  await role("button", { name: "Guardar gasto" }).click();
  await toastSays("Gasto guardado");
  await page.waitForURL(/\/gastos\?mes=/);
  await text(unique).waitFor();
  await text(/45\.000/).first().waitFor();
});

await step("validación: monto vacío muestra error", async () => {
  await page.goto(`${BASE_URL}/gastos/nuevo`);
  const amount = v(page.getByPlaceholder("$0"));
  await amount.evaluate((el) => el.removeAttribute("required"));
  await role("button", { name: "Guardar gasto" }).click();
  await text("Escribe el monto.").first().waitFor();
  await role("link", { name: "Cancelar" }).click();
  await role("heading", { name: "Por categoría" }).waitFor();
});

await step("definir presupuesto y ver el resumen", async () => {
  await role("link", { name: "Ajustar" }).click();
  await role("heading", { name: "Presupuestos" }).waitFor();
  await v(page.getByLabel("Comida")).fill("40000");
  await role("button", { name: "Guardar presupuestos" }).click();
  await toastSays("Presupuestos guardados");
  await text(/Te pasaste/).waitFor();
  await text(/Excedido por/).waitFor();
  await page.screenshot({ path: `${SHOTS}/gastos.png` });
});

await step("filtros fijos / variables", async () => {
  await role("button", { name: "Variables" }).click();
  await text("No hay movimientos con este filtro.").waitFor();
  await role("button", { name: "Fijos" }).click();
  await text(unique).waitFor();
  await role("button", { name: "Todos" }).click();
});

await step("borrar el gasto", async () => {
  await role("button", { name: `Borrar ${unique}` }).click();
  await confirmModal("Cancelar");
  await text(unique).waitFor();
  await role("button", { name: `Borrar ${unique}` }).click();
  await confirmModal("Borrar");
  await toastSays("Gasto borrado");
  await text(unique).waitFor({ state: "detached" });
});

await step("copiar gastos fijos del mes anterior", async () => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const [y, m] = today.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 15)).toISOString().slice(0, 10);
  const fixed = `${unique} fijo`;

  await page.goto(`${BASE_URL}/gastos/nuevo`);
  await v(page.getByPlaceholder("$0")).fill("30000");
  await v(page.getByPlaceholder("Ej. Mercado")).fill(fixed);
  await v(page.locator('input[name="date"]')).fill(prev);
  await text("Gasto fijo (se repite cada mes)").click();
  await role("button", { name: "Guardar gasto" }).click();
  await page.waitForURL(new RegExp(`mes=${prev.slice(0, 7)}`));
  await text(fixed).waitFor();

  await role("link", { name: "Mes siguiente" }).click();
  await role("button", { name: "Copiarlos" }).click();
  await toastSays("1 gasto fijo copiado");
  await text(fixed).waitFor();
  assert.equal(await role("button", { name: "Copiarlos" }).count(), 0);

  // Clean up both copies.
  await role("button", { name: `Borrar ${fixed}` }).click();
  await confirmModal("Borrar");
  await text(fixed).waitFor({ state: "detached" });
  await role("link", { name: "Mes anterior" }).click();
  await role("button", { name: `Borrar ${fixed}` }).click();
  await confirmModal("Borrar");
  await text(fixed).waitFor({ state: "detached" });
});

await step("ahorro: sueldo oculto, revelar y ahorro del mes", async () => {
  const spentLabel = `${unique} ahorro`;
  await page.goto(`${BASE_URL}/gastos/nuevo`);
  await v(page.getByPlaceholder("$0")).fill("10000");
  await v(page.getByPlaceholder("Ej. Mercado")).fill(spentLabel);
  await role("button", { name: "Guardar gasto" }).click();
  await text(spentLabel).waitFor();

  await role("link", { name: "Inicio" }).click();
  await role("heading", { name: "Resumen" }).waitFor();
  await role("link", { name: /Agregar mi sueldo|Cambiar sueldo/ }).click();
  await role("heading", { name: "Sueldo mensual" }).waitFor();
  await v(page.getByLabel("Sueldo mensual (COP)")).fill("3210000");
  await role("button", { name: "Guardar sueldo" }).click();
  await toastSays("Sueldo guardado");
  await role("heading", { name: "Resumen" }).waitFor();

  await text(/\$\s3\.•••\.•••/).waitFor();
  assert.doesNotMatch(await page.content(), /3\.210\.000|3210000/, "el sueldo completo no debe llegar al navegador");
  await role("button", { name: "Mostrar sueldo" }).click();
  await text(/\$\s3\.210\.000/).waitFor();
  await text(/\$\s3\.200\.000/).first().waitFor(); // ahorro del mes = 3.210.000 − 10.000
  await role("button", { name: "Mostrar sueldo" }).waitFor({ timeout: 8000 }); // se oculta solo
  await page.screenshot({ path: `${SHOTS}/inicio-ahorro.png` });

  await role("link", { name: "Gastos" }).click();
  await role("button", { name: `Borrar ${spentLabel}` }).click();
  await confirmModal("Borrar");
  await text(spentLabel).waitFor({ state: "detached" });
});

await step("sin errores de JavaScript en el navegador", async () => {
  assert.deepEqual(errors, []);
});

await step("modo oscuro desde Ajustes y se mantiene al recargar", async () => {
  await role("link", { name: "Inicio" }).click();
  await role("link", { name: "Ajustes" }).click();
  await role("heading", { name: "Ajustes" }).waitFor();
  await role("radio", { name: "Oscuro" }).click();
  const bg = () => page.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor]);
  assert.deepEqual(await bg(), ["dark", "rgb(0, 0, 0)"]);
  await page.reload();
  await role("heading", { name: "Ajustes" }).waitFor();
  assert.deepEqual(await bg(), ["dark", "rgb(0, 0, 0)"]);
  assert.equal(await role("radio", { name: "Oscuro" }).getAttribute("aria-checked"), "true");
  await page.screenshot({ path: `${SHOTS}/ajustes-oscuro.png` });
  await role("radio", { name: "Claro" }).click();
  assert.deepEqual(await bg(), ["light", "rgb(242, 242, 247)"]);
  await role("radio", { name: "Sistema" }).click();
});

await step("Ajustes muestra cómo instalar la app", async () => {
  await page.getByRole("region", { name: "Instalar la app" }).waitFor();
});

await step("cerrar sesión con confirmación", async () => {
  await role("button", { name: "Cerrar sesión" }).click();
  await confirmModal("Cerrar sesión");
  await page.waitForURL(/\/login/);
});

await browser.close();
console.log("TODO OK");
