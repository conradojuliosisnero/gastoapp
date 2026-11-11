import Link from "next/link";
import { decrypt } from "@/lib/crypto";
import { isUpcoming } from "@/lib/gastos";
import { formatCOP, monthRange, today } from "@/lib/money";
import { getPlan } from "@/app/(app)/internet/data";

const ICON = {
  gastos: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><path d="M7 15h3" /></>,
  internet: <><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><path d="M2 9a15 15 0 0 1 20 0" /><circle cx="12" cy="19.5" r="1" /></>,
  juegos: <path d="M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.3A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4z" />,
};

// One row per module with this month's headline, linking to it.
export default async function ModulesSummary({ supabase }) {
  const month = monthRange();
  const todayDate = today();
  const [{ data: txs, error }, plan] = await Promise.all([
    supabase.from("transactions").select("module, occurred_on, amount_enc").gte("occurred_on", month.start).lt("occurred_on", month.end),
    getPlan(supabase),
  ]);
  if (error) throw error;

  const totals = { gastos: 0, juegos: 0 };
  const counts = { gastos: 0, juegos: 0 };
  for (const t of txs) {
    if (isUpcoming(t.occurred_on, todayDate)) continue;
    totals[t.module] += Number(decrypt(t.amount_enc));
    counts[t.module] += 1;
  }

  let internet = "Configura tu plan compartido";
  if (plan) {
    const { data: paid } = await supabase.from("internet_payments").select("member_id").eq("period", month.key).in("member_id", plan.members.map((m) => m.id));
    internet = `Pagaron ${paid?.length ?? 0} de ${plan.members.length} · ${formatCOP(plan.amount)}`;
  }

  const rows = [
    { href: "/gastos", key: "gastos", label: "Gastos", detail: `${formatCOP(totals.gastos)} · ${counts.gastos} ${counts.gastos === 1 ? "movimiento" : "movimientos"}`, color: "bg-[#1f7a3a]" },
    { href: "/internet", key: "internet", label: "Internet compartido", detail: internet, color: "bg-primary" },
    { href: "/juegos", key: "juegos", label: "Videojuegos", detail: `${formatCOP(totals.juegos)} este mes`, color: "bg-[#b4530a]" },
  ];

  return (
    <section aria-labelledby="modulos" className="flex flex-col gap-2">
      <h2 id="modulos" className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{month.label}</h2>
      <ul className="overflow-hidden rounded-2xl bg-card">
        {rows.map((r) => (
          <li key={r.key} className="border-t border-line first:border-t-0">
            <Link href={r.href} className="flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-fill">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white ${r.color}`}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICON[r.key]}</svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-medium">{r.label}</span>
                <span className="truncate text-[13px] text-muted tabular-nums">{r.detail}</span>
              </span>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
