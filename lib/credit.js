// Credit-card math: which statement a purchase falls in, when each installment is paid, and how much.
// shortcut: installments are split evenly without interest; add a per-purchase rate if the user needs real bank figures.

const pad = (n) => String(n).padStart(2, "0");

export function addMonths(period, k) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + k, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

// "2027-02", 31 -> "2027-02-28": the day clamped to the month's length.
export function dayIn(period, day) {
  const [y, m] = period.split("-").map(Number);
  return `${period}-${pad(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate()))}`;
}

// The statement (month of the cut) that includes a purchase: on or before the cut day -> this month's, else next month's.
export const statementPeriod = (date, cutDay) => (date <= dayIn(date.slice(0, 7), cutDay) ? date.slice(0, 7) : addMonths(date.slice(0, 7), 1));

// A statement is paid on the first pay day after its cut.
export const paymentDate = (statement, cutDay, payDay) => dayIn(payDay > cutDay ? statement : addMonths(statement, 1), payDay);

// Even split; the leftover pesos go to the first installment so the total always matches.
export function installments({ date, amount, count = 1 }, card) {
  const n = Math.max(1, count);
  const base = Math.floor(amount / n);
  const first = statementPeriod(date, card.cutDay);
  return Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    of: n,
    date: paymentDate(addMonths(first, i), card.cutDay, card.payDay),
    amount: i === 0 ? amount - base * (n - 1) : base,
  }));
}
