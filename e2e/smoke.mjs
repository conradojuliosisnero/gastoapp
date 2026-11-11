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
    console.log(`✗ ${name}\n  ${e.message.split("\n").slice(0, 12).join("\n  ")}`);
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
  await role("heading", { name: "Movimientos" }).waitFor();
  await role("button", { name: /Por categoría/ }).click();
  await role("dialog").getByText("Comida", { exact: true }).waitFor();
  await role("button", { name: "Listo" }).click();
  await role("dialog").waitFor({ state: "detached" });
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
  // Reopening the form must start empty (Next keeps visited screens in memory).
  await role("link", { name: "Agregar gasto" }).click();
  await role("heading", { name: "Nuevo gasto" }).waitFor();
  assert.equal(await v(page.getByPlaceholder("$0")).inputValue(), "", "el formulario debe abrir vacío");
  await role("link", { name: "Cancelar" }).click();
  await role("heading", { name: "Movimientos" }).waitFor();
});

await step("validación: monto vacío muestra error", async () => {
  await page.goto(`${BASE_URL}/gastos/nuevo`);
  const amount = v(page.getByPlaceholder("$0"));
  await amount.evaluate((el) => el.removeAttribute("required"));
  await role("button", { name: "Guardar gasto" }).click();
  await text("Escribe el monto.").first().waitFor();
  await role("link", { name: "Cancelar" }).click();
  await role("heading", { name: "Movimientos" }).waitFor();
});

await step("definir presupuesto y ver el resumen", async () => {
  await role("button", { name: /Por categoría/ }).click();
  await role("link", { name: "Ajustar presupuestos" }).click();
  await role("heading", { name: "Categorías" }).waitFor();
  await v(page.getByLabel("Comida", { exact: true })).fill("40000");
  await role("button", { name: "Guardar presupuestos" }).click();
  await toastSays("Presupuestos guardados");
  await text(/Te pasaste/).waitFor();
  await role("button", { name: /1 excedida/ }).click();
  await role("dialog").getByText(/Excedido por/).waitFor();
  await role("button", { name: "Listo" }).click();
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

await step("pago futuro: etiqueta y no cuenta como gastado", async () => {
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const future = new Date(`${todayStr}T12:00:00Z`);
  future.setUTCDate(future.getUTCDate() + 1);
  const futureStr = future.toISOString().slice(0, 10);
  const sameMonth = futureStr.slice(0, 7) === todayStr.slice(0, 7);
  const label = `${unique} futuro`;

  await page.goto(`${BASE_URL}/gastos/nuevo`);
  await v(page.getByPlaceholder("$0")).fill("77000");
  await v(page.getByPlaceholder("Ej. Mercado")).fill(label);
  await v(page.locator('input[name="date"]')).fill(futureStr);
  await role("button", { name: "Guardar gasto" }).click();
  await page.waitForURL(new RegExp(`mes=${futureStr.slice(0, 7)}`));

  const row = v(page.getByRole("listitem").filter({ hasText: label }));
  await row.getByText("Pago futuro").waitFor();
  await text("Pagos futuros (1)").waitFor();
  const summary = await v(page.locator("section").filter({ hasText: "Gastado en el mes" })).innerText();
  assert.match(summary, /Gastado en el mes\s+\$\s0\b/, "el pago futuro no debe sumar a lo gastado");

  await role("link", { name: /Notificaciones, \d+ pendiente/ }).click();
  await role("heading", { name: "Notificaciones" }).waitFor();
  await v(page.getByRole("link", { name: new RegExp(label) })).getByText(/Pago el/).waitFor();
  await page.goBack();
  await text(label).waitFor();

  if (sameMonth) {
    await role("link", { name: "Inicio" }).click();
    await text(/Pagos futuros este mes: −\$\s77\.000/).waitFor();
    await role("link", { name: "Gastos" }).click();
  }
  await role("button", { name: `Borrar ${label}` }).click();
  await confirmModal("Borrar");
  await text(label).waitFor({ state: "detached" });
});

await step("ingreso extra suma al ahorro y se puede borrar", async () => {
  const label = `${unique} venta`;
  await page.goto(`${BASE_URL}/inicio`);
  const savedBefore = await v(page.locator("section").filter({ hasText: "Ahorro del mes" })).innerText();
  await role("link", { name: "Agregar ingreso extra" }).click();
  await role("heading", { name: "Ingreso extra" }).waitFor();
  await v(page.getByPlaceholder("$0")).fill("200000");
  await v(page.getByPlaceholder(/Venta, regalo/)).fill(label);
  await role("button", { name: "Guardar ingreso" }).click();
  await toastSays("Ingreso extra guardado");
  await text(label).waitFor();
  await text(/\+\$\s200\.000/).first().waitFor();
  const savedAfter = await v(page.locator("section").filter({ hasText: "Ahorro del mes" })).innerText();
  assert.notEqual(savedAfter, savedBefore, "el ahorro del mes debe cambiar");
  await role("button", { name: `Borrar ingreso ${label}` }).click();
  await confirmModal("Borrar");
  await toastSays("Ingreso borrado");
  await text(label).waitFor({ state: "detached" });
});

await step("crear categoría propia desde Nuevo gasto y borrarla", async () => {
  const cat = `Mascotas ${unique.slice(-5)}`;
  const label = `${unique} mascota`;
  await page.goto(`${BASE_URL}/gastos/nuevo`);
  await v(page.getByPlaceholder("$0")).fill("15000");
  await role("button", { name: "Nueva" }).click();
  await v(page.getByLabel("Nombre de la nueva categoría")).fill(cat);
  await role("button", { name: "Crear" }).click();
  await toastSays(`Categoría "${cat}" creada`);
  assert.equal(await page.getByRole("radio", { name: cat }).isChecked(), true);
  await v(page.getByPlaceholder("Ej. Mercado")).fill(label);
  await role("button", { name: "Guardar gasto" }).click();
  await text(label).waitFor();
  await v(page.getByRole("listitem").filter({ hasText: label })).getByText(cat).waitFor();

  await page.goto(`${BASE_URL}/gastos/presupuesto`);
  await role("button", { name: `Borrar categoría ${cat}` }).click();
  await confirmModal("Borrar");
  await toastSays(`Categoría "${cat}" borrada`);
  await page.goto(`${BASE_URL}/gastos`);
  await v(page.getByRole("listitem").filter({ hasText: label })).getByText("Sin categoría").waitFor();
  await role("button", { name: `Borrar ${label}` }).click();
  await confirmModal("Borrar");
  await text(label).waitFor({ state: "detached" });
});

await step("internet: configurar plan entre 3 y marcar pagos", async () => {
  await role("link", { name: "Internet" }).click();
  await role("link", { name: "Configurar plan" }).click();
  await role("heading", { name: "Plan de internet" }).waitFor();
  await v(page.getByRole("textbox", { name: "Nombre", exact: true })).fill("Internet e2e");
  await v(page.getByPlaceholder("$0")).fill("120000");
  await v(page.getByLabel("Nombre del integrante 2")).fill("Cliente A");
  await v(page.getByLabel("Nombre del integrante 3")).fill("Cliente B");
  assert.equal(await v(page.getByText(/^\$\s40\.000$/)).count(), 3, "partes iguales de 40.000");
  await role("button", { name: "Guardar plan" }).click();
  await toastSays("Plan guardado");
  await text("0 de 3 pagaron").waitFor();

  await role("button", { name: "Marcar pago de Cliente A", exact: true }).click();
  await toastSays("Cliente A: pago registrado");
  await text("1 de 3 pagaron").waitFor();
  await text(/Recaudado \$\s40\.000/).waitFor();

  await role("button", { name: "Marcar pago de tu parte", exact: true }).click();
  await toastSays("Tu parte: pago registrado");
  await role("link", { name: "Gastos" }).click();
  await text("Internet · Internet e2e (tu parte)").waitFor();

  await role("link", { name: "Internet" }).click();
  await role("button", { name: "Desmarcar pago de tu parte", exact: true }).click();
  await confirmModal("Desmarcar");
  await toastSays("Tu parte: pago desmarcado");
  await text("1 de 3 pagaron").waitFor();
  await role("link", { name: "Gastos" }).click();
  await role("heading", { name: "Movimientos" }).waitFor();
  assert.equal(await text("Internet · Internet e2e (tu parte)").count(), 0, "tu parte desmarcada sale de gastos");

  await role("link", { name: "Internet" }).click();
  await role("link", { name: "Editar plan" }).click();
  await role("radio", { name: "Personalizado" }).click();
  await v(page.getByLabel(/^Parte de /)).nth(0).fill("50000");
  await v(page.getByLabel(/^Parte de /)).nth(1).fill("35000");
  await v(page.getByLabel(/^Parte de /)).nth(2).fill("35000");
  await text(/Suman \$\s120\.000 de \$\s120\.000/).waitFor();
  await role("button", { name: "Guardar plan" }).click();
  await toastSays("Plan guardado");
  await text("Partes personalizadas").waitFor();
  await text(/\$\s35\.000 · Pagado/).waitFor();
});

await step("videojuegos: límite, compra por plataforma y lista de deseos", async () => {
  const game = `${unique} juego`;
  await role("link", { name: "Juegos" }).click();
  await role("link", { name: "Poner límite" }).click();
  await role("heading", { name: "Límite mensual" }).waitFor();
  await v(page.getByPlaceholder("Sin límite")).fill("50000");
  await role("button", { name: "Guardar límite" }).click();
  await toastSays("Límite guardado");
  await text(/Límite mensual \$\s50\.000/).waitFor();

  await role("link", { name: "Agregar compra de juego" }).click();
  await role("heading", { name: "Nueva compra" }).waitFor();
  await v(page.getByPlaceholder("$0")).fill("89900");
  await text("DLC", { exact: true }).click();
  await v(page.getByPlaceholder("Ej. Expansión de historia")).fill(game);
  await role("radio", { name: "PC" }).click();
  await role("button", { name: "Guardar compra" }).click();
  await toastSays("Compra guardada");
  await page.waitForURL(/\/juegos\?mes=/);
  await text(game).waitFor();
  await text(/\+\$\s39\.900 sobre el límite/).waitFor();

  await role("radio", { name: "PS5" }).click();
  await text("No hay compras en esta plataforma.").waitFor();
  await role("radio", { name: "Todas" }).click();

  await role("link", { name: "Agregar" }).click();
  await role("heading", { name: "Lista de deseos" }).waitFor();
  await v(page.getByPlaceholder(/Juego de fútbol/)).fill(`${unique} deseo`);
  await v(page.getByRole("textbox", { name: "Precio actual" })).fill("150000");
  await v(page.getByRole("textbox", { name: "Lo compro a" })).fill("160000");
  await role("button", { name: "Agregar a la lista" }).click();
  await toastSays("Agregado a tu lista de deseos");
  await text("¡Llegó a tu precio!").waitFor();

  await role("link", { name: /Notificaciones, \d+ pendiente/ }).click();
  await text("Te pasaste del límite de juegos").waitFor();
  await page.goBack();

  await role("button", { name: `Borrar ${game}` }).click();
  await confirmModal("Borrar");
  await toastSays("Compra borrada");
  await role("button", { name: `Quitar ${unique} deseo` }).click();
  await confirmModal("Borrar");
  await toastSays("Quitado de la lista");
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
