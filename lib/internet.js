// Each member's share of the monthly bill, in whole pesos.
// equal: the remainder goes to the first members so the shares always add up to the total.
// custom: uses each member's own share as given.
export function computeShares(total, members, mode) {
  if (mode === "custom") return members.map((m) => m.share ?? 0);
  const base = Math.floor(total / members.length);
  const remainder = total - base * members.length;
  return members.map((_, i) => base + (i < remainder ? 1 : 0));
}

// "2026-02" + day 31 -> "2026-02-28": the due day clamped to the month's length.
export function dueDate(period, dueDay) {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${period}-${String(Math.min(dueDay, last)).padStart(2, "0")}`;
}
