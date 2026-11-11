export const DEFAULT_CATEGORIES = ["Vivienda", "Comida", "Transporte", "Servicios", "Ocio", "Salud", "Otros"];

// categories: [{ id, name, budget|null }], transactions: [{ categoryId|null, amount }]
export function summarize(categories, transactions) {
  const spentBy = new Map();
  for (const t of transactions) spentBy.set(t.categoryId, (spentBy.get(t.categoryId) ?? 0) + t.amount);

  const rows = categories.map((c) => {
    const spent = spentBy.get(c.id) ?? 0;
    return { ...c, spent, over: c.budget != null && spent > c.budget };
  });

  return {
    rows,
    total: transactions.reduce((sum, t) => sum + t.amount, 0),
    budget: categories.reduce((sum, c) => sum + (c.budget ?? 0), 0),
    uncategorized: spentBy.get(null) ?? 0,
  };
}
