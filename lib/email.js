export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

// shortcut: Resend's shared sender only delivers to the account owner's address; verify a domain and set EMAIL_FROM to email other users.
export async function sendEmail({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Subtrack <onboarding@resend.dev>", to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
