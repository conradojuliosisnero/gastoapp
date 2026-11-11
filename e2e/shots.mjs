// Screenshots of the main screens on phone (390px) and desktop (1280px), light and dark, for visual review.
// Usage: BASE_URL=... E2E_EMAIL=... E2E_PASSWORD=... node e2e/shots.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const { BASE_URL, E2E_EMAIL, E2E_PASSWORD, SHOTS = "/tmp/shots" } = process.env;
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
for (const [device, opts] of [
  ["movil", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ["escritorio", { viewport: { width: 1280, height: 860 } }],
]) {
  const page = await browser.newPage({ ...opts, locale: "es-CO" });
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("tu@correo.com").fill(E2E_EMAIL);
  await page.getByPlaceholder("Mínimo 8 caracteres").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/inicio/);
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => localStorage.setItem("theme", t), theme);
    for (const path of ["/inicio", "/gastos", "/tarjetas", "/gastos/nuevo"]) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SHOTS}/${device}-${theme}${path.replaceAll("/", "-")}.png` });
    }
  }
  await page.close();
}
await browser.close();
console.log("capturas listas");
