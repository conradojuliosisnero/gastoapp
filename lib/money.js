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
