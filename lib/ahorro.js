// incomes: [{ period: "2026-09", amount }] — a row only when the salary changes; later months inherit it.
// expenses: [{ date: "2026-10-03", amount }]. Months run from the first salary month to `currentPeriod`.
export function computeSavings({ incomes, expenses, currentPeriod }) {
  const sorted = [...incomes].sort((a, b) => a.period.localeCompare(b.period));
  if (sorted.length === 0 || sorted[0].period > currentPeriod) return { months: [], total: 0, current: null };

  const spentBy = new Map();
  for (const e of expenses) {
    const period = e.date.slice(0, 7);
    spentBy.set(period, (spentBy.get(period) ?? 0) + e.amount);
  }

  const months = [];
  let income = 0;
  let next = 0;
  for (let period = sorted[0].period; period <= currentPeriod; period = nextPeriod(period)) {
    while (next < sorted.length && sorted[next].period <= period) income = sorted[next++].amount;
    const spent = spentBy.get(period) ?? 0;
    months.push({ period, income, spent, saved: income - spent });
  }

  return { months, total: months.reduce((sum, m) => sum + m.saved, 0), current: months.at(-1) };
}

function nextPeriod(period) {
  const [y, m] = period.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
