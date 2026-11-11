import { test } from "node:test";
import assert from "node:assert/strict";
import { digest, isPushEndpoint } from "./reminders.js";

const a = (title, href = "/gastos") => ({ title, body: `${title} detalle`, href });

test("digest: nada que avisar, uno, o varios", () => {
  assert.equal(digest([]), null);
  const one = digest([a("Pago el 12 nov")], "https://x.app");
  assert.equal(one.title, "Pago el 12 nov");
  assert.equal(one.url, "/gastos");
  const many = digest([a("A"), a("B"), a("C <script>")], "https://x.app");
  assert.equal(many.title, "Tienes 3 avisos en GastoApp");
  assert.equal(many.body, "A · B y 1 más");
  assert.equal(many.url, "/notificaciones");
  assert.ok(many.html.includes("C &lt;script&gt;") && !many.html.includes("<script>"));
});

test("solo acepta endpoints de servicios push reales", () => {
  assert.ok(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
  assert.ok(isPushEndpoint("https://web.push.apple.com/QGx"));
  assert.ok(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x"));
  assert.ok(!isPushEndpoint("http://fcm.googleapis.com/x"));
  assert.ok(!isPushEndpoint("https://evil.com/fcm.googleapis.com"));
  assert.ok(!isPushEndpoint("https://169.254.169.254/latest"));
  assert.ok(!isPushEndpoint("nope"));
});
