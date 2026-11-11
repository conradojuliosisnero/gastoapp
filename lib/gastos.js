export const DEFAULT_CATEGORIES = {
  gastos: ["Vivienda", "Comida", "Transporte", "Servicios", "Ocio", "Salud", "Otros"],
  juegos: ["Juego", "DLC", "Micropago", "Suscripción"],
};

// A movement dated after today is a future payment: shown, but not counted as spent yet.
export const isUpcoming = (date, today) => date > today;

// categories: [{ id, name, budget|null }], transactions: [{ categoryId|null, amount, date }], today: "YYYY-MM-DD"
export function summarize(categories, transactions, today) {
  const paid = transactions.filter((t) => !isUpcoming(t.date, today));
  const upcoming = transactions.filter((t) => isUpcoming(t.date, today));

  const spentBy = new Map();
  for (const t of paid) spentBy.set(t.categoryId, (spentBy.get(t.categoryId) ?? 0) + t.amount);

  const rows = categories.map((c) => {
    const spent = spentBy.get(c.id) ?? 0;
    return { ...c, spent, over: c.budget != null && spent > c.budget };
  });

  return {
    rows,
    total: paid.reduce((sum, t) => sum + t.amount, 0),
    upcoming: upcoming.reduce((sum, t) => sum + t.amount, 0),
    upcomingCount: upcoming.length,
    budget: categories.reduce((sum, c) => sum + (c.budget ?? 0), 0),
    uncategorized: spentBy.get(null) ?? 0,
  };
}
