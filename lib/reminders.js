const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Turns the bell's alerts into one push + one email. Null when there's nothing to say.
export function digest(alerts, baseUrl = "") {
  if (!alerts.length) return null;
  const n = alerts.length;
  const title = n === 1 ? alerts[0].title : `Tienes ${n} avisos en Subtrack`;
  const body =
    n === 1 ? alerts[0].body : alerts.slice(0, 2).map((a) => a.title).join(" · ") + (n > 2 ? ` y ${n - 2} más` : "");
  const url = n === 1 ? alerts[0].href : "/notificaciones";
  const text = `${alerts.map((a) => `• ${a.title}: ${a.body}`).join("\n")}\n\nAbrir Subtrack: ${baseUrl}${url}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:auto;color:#1c1c1e">
<h1 style="font-size:20px">${escape(title)}</h1>
<ul style="padding:0;list-style:none">${alerts
    .map((a) => `<li style="padding:12px 0;border-top:1px solid #e5e5ea"><b>${escape(a.title)}</b><br><span style="color:#6e6e73">${escape(a.body)}</span></li>`)
    .join("")}</ul>
<p><a href="${escape(baseUrl + url)}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Abrir Subtrack</a></p>
<p style="color:#6e6e73;font-size:12px">Recibes este correo porque activaste los recordatorios por correo en Ajustes.</p></div>`;
  return { title, body, url, text, html };
}

// Only real browser push services; the server POSTs to this URL, so never accept arbitrary hosts.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /\.push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /^[\w.-]*push\.services\.mozilla\.com$/];
export function isPushEndpoint(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

export const appUrl = () => (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
