const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export const formatCOP = (amount) => cop.format(amount);

// "$ 4.500.000" -> "$ 4.•••.•••": shows the size of the number but not the number.
export const maskCOP = (amount) => {
  let seen = 0;
  return cop.format(amount).replace(/\d/g, (d) => (seen++ === 0 ? d : "•"));
};

// "45.000", "$ 45000" -> 45000. Returns null when there are no digits.
export function parseAmount(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

// shortcut: "today" is Colombia's date for every user; pass the user's time zone if accounts ever span countries.
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// "2026-11" -> query bounds and neighbours. Invalid input falls back to the current month.
export function monthRange(mes) {
  const key = MONTH.test(mes ?? "") ? mes : today().slice(0, 7);
  const [y, m] = key.split("-").map(Number);
  const shift = (delta) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const label = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return {
    key,
    start: `${key}-01`,
    end: `${shift(1)}-01`,
    prev: shift(-1),
    next: shift(1),
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

// Games can be bought in dollars. USD amounts are kept in cents so they stay integers.
export const CURRENCIES = ["COP", "USD"];
const usd = new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD" });
export const formatMoney = (minor, currency = "COP") => (currency === "USD" ? usd.format(minor / 100) : cop.format(minor));

// "69.99", "69,99", "1,299.5", "70" -> cents. A separator followed by 1–2 final digits is the decimal one.
export function parseUSD(input) {
  const s = String(input ?? "").replace(/[^\d.,]/g, "");
  const m = s.match(/^(.*?)[.,](\d{1,2})$/);
  const whole = (m ? m[1] : s).replace(/\D/g, "");
  const cents = m ? m[2].padEnd(2, "0") : "00";
  return whole || m ? Number(whole || 0) * 100 + Number(cents) : null;
}

export const parseMoney = (input, currency = "COP") => (currency === "USD" ? parseUSD(input) : parseAmount(input));

// What the amount field shows while typing: grouped pesos, or dollars with up to 2 decimals.
export function typingMoney(input, currency = "COP") {
  if (currency !== "USD") {
    const n = parseAmount(input);
    return n == null ? "" : new Intl.NumberFormat("es-CO").format(n);
  }
  const [whole, ...rest] = String(input ?? "").replace(/[^\d.,]/g, "").replace(/,/g, ".").split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

export const usdToCop = (cents, rate) => Math.round((cents * rate) / 100);
