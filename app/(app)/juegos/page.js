import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getCategories } from "@/lib/categories";
import { isUpcoming } from "@/lib/gastos";
import { formatCOP, monthRange, today } from "@/lib/money";
import { Purchases, Wishlist } from "./lists";
import MonthBars from "./month-bars";
import CountUp from "@/app/count-up";

export const metadata = { title: "Videojuegos" };

const Chevron = ({ d }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const shortMonth = (period) => new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(new Date(`${period}-01T00:00:00Z`)).replace(".", "");

export default async function JuegosPage({ searchParams }) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const month = monthRange(mes);
  const todayDate = today();

  const months = [month];
  while (months.length < 6) months.unshift(monthRange(months[0].prev));

  const [types, txs, limitRow, wishes] = await Promise.all([
    getCategories(supabase, "juegos"),
    supabase
      .from("transactions")
      .select("id, category_id, occurred_on, amount_enc, description_enc, platform, currency, original_amount_enc")
      .eq("module", "juegos")
      .gte("occurred_on", months[0].start)
      .lt("occurred_on", month.end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("module_limits").select("amount_enc").eq("module", "juegos").maybeSingle(),
    supabase.from("wishlist").select("id, title, platform, currency, current_price_enc, target_price_enc").order("created_at", { ascending: false }),
  ]);
  if (txs.error) throw txs.error;
  if (wishes.error) throw wishes.error;

  const typeNames = new Map(types.map((t) => [t.id, t.name]));
  const all = txs.data.map((t) => ({
    id: t.id,
    date: t.occurred_on,
    amount: Number(decrypt(t.amount_enc)),
    usd: t.currency === "USD" && t.original_amount_enc ? Number(decrypt(t.original_amount_enc)) : null,
    title: t.description_enc ? decrypt(t.description_enc) : null,
    type: typeNames.get(t.category_id) ?? "Sin tipo",
    platform: t.platform ?? "Otra",
    upcoming: isUpcoming(t.occurred_on, todayDate),
  }));
  const thisMonth = all.filter((t) => t.date >= month.start);
  const paid = thisMonth.filter((t) => !t.upcoming);
  const spent = paid.reduce((s, t) => s + t.amount, 0);
  const limit = limitRow.data ? Number(decrypt(limitRow.data.amount_enc)) : null;
  const over = limit != null && spent > limit;
  const byType = types.map((t) => ({ name: t.name, total: paid.filter((p) => p.type === t.name).reduce((s, p) => s + p.amount, 0) }));
  const bars = months.map((m) => {
    const total = all.filter((t) => t.date >= m.start && t.date < m.end && !t.upcoming).reduce((s, t) => s + t.amount, 0);
    return { period: m.key, label: shortMonth(m.key), total, text: formatCOP(total), over: limit != null && total > limit };
  });

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <h1 className="sr-only">Videojuegos</h1>
      <nav aria-label="Mes" className="flex items-center justify-between px-1 lg:col-span-2">
        <Link href={`/juegos?mes=${month.prev}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m15 6-6 6 6 6" />
        </Link>
        <span className="text-[17px] font-semibold">{month.label}</span>
        <Link href={`/juegos?mes=${month.next}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10">
          <Chevron d="m9 6 6 6-6 6" />
        </Link>
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] text-muted">Gastado en juegos</span>
            <CountUp value={spent} className={`text-[36px] font-bold tracking-tight tabular-nums ${over ? "text-warn" : ""}`} />
          </div>
          {limit != null ? (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${over ? "bg-warn/15 text-warn" : "bg-ok/15 text-ok"}`}>
              {over ? `+${formatCOP(spent - limit)} sobre el límite` : `Quedan ${formatCOP(limit - spent)}`}
            </span>
          ) : null}
        </div>
        <MonthBars bars={bars} limit={limit} />
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span>{limit != null ? `Límite mensual ${formatCOP(limit)}` : "Sin límite mensual"}</span>
          <Link href="/juegos/limite" className="flex min-h-9 items-center rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
            {limit != null ? "Cambiar límite" : "Poner límite"}
          </Link>
        </div>
      </section>

      <section aria-label="Por tipo" className="grid grid-cols-2 gap-2.5">
        {byType.map((t) => (
          <div key={t.name} className="flex flex-col gap-1 rounded-2xl bg-card p-3.5">
            <span className="text-[13px] text-muted">{t.name}</span>
            <span className="text-xl font-bold tabular-nums">{formatCOP(t.total)}</span>
          </div>
        ))}
      </section>

      </div>

      <div className="flex min-w-0 flex-col gap-5">
      <Purchases items={thisMonth} />
      <Wishlist items={wishes.data.map((w) => ({
        id: w.id,
        title: w.title,
        platform: w.platform,
        currency: w.currency,
        current: Number(decrypt(w.current_price_enc)),
        target: w.target_price_enc ? Number(decrypt(w.target_price_enc)) : null,
      }))} />
      </div>
    </div>
  );
}
