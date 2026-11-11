// Yearly cost of a subscription and whether the 12-month plan beats paying monthly.
// Amounts are in the subscription's own minor units (pesos, or USD cents).
export function compare({ monthly = null, annual = null, billing = "mensual" }) {
  const twelve = monthly != null ? monthly * 12 : null;
  const yearCost = billing === "anual" && annual != null ? annual : (twelve ?? annual);
  if (twelve == null || annual == null) return { yearCost, best: null, saving: 0, pct: 0 };
  const best = annual < twelve ? "anual" : annual > twelve ? "mensual" : null;
  const saving = Math.abs(twelve - annual);
  return { yearCost, best, saving, pct: Math.round((saving / Math.max(twelve, annual)) * 100) };
}

// Totals in pesos. `toCop(amount, currency)` converts each subscription's money.
export function totals(subs, toCop) {
  let year = 0;
  let potential = 0;
  for (const s of subs) {
    const c = compare(s);
    year += toCop(c.yearCost ?? 0, s.currency);
    // Money left on the table: paying monthly when the yearly plan is cheaper, or the reverse.
    if (c.best && c.best !== s.billing) potential += toCop(c.saving, s.currency);
  }
  return { year, month: Math.round(year / 12), potential };
}
