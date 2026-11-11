"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatCOP } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { deleteTransaction } from "@/app/(app)/gastos/actions";
import { deleteWish } from "./actions";

const PLATFORMS = ["Todas", "PS5", "PC", "Otra"];
const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

const Trash = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
  </svg>
);

function useRemove(action, { title, done }) {
  const [confirm, dialog] = useConfirm();
  const [busyId, setBusyId] = useState(null);
  const [, startTransition] = useTransition();
  async function remove(id, message) {
    if (!(await confirm({ title, message, confirmLabel: "Borrar", destructive: true }))) return;
    setBusyId(id);
    startTransition(async () => {
      const result = await action(id);
      setBusyId(null);
      result.error ? toast(result.error, "error") : toast(done);
    });
  }
  return { remove, busyId, dialog };
}

export function Purchases({ items }) {
  const [platform, setPlatform] = useState("Todas");
  const { remove, busyId, dialog } = useRemove(deleteTransaction, { title: "¿Borrar esta compra?", done: "Compra borrada" });
  const visible = platform === "Todas" ? items : items.filter((i) => i.platform === platform);

  return (
    <section aria-labelledby="compras" className="flex flex-col gap-3">
      {dialog}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 id="compras" className="text-xl font-bold tracking-tight">Compras</h2>
        <div role="radiogroup" aria-label="Plataforma" className="grid grid-cols-4 gap-0.5 rounded-[10px] bg-segment p-0.5">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={platform === p}
              onClick={() => setPlatform(p)}
              className="min-h-8 rounded-lg px-2.5 text-[13px] font-semibold transition active:scale-95 aria-checked:bg-card aria-checked:shadow-sm"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">
          {items.length === 0 ? "Sin compras este mes. Toca + para registrar una." : "No hay compras en esta plataforma."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-card">
          {visible.map((t) => (
            <li key={t.id} className={`flex items-center gap-3 border-t border-line py-3 pr-2 pl-4 first:border-t-0 ${busyId === t.id ? "opacity-40" : ""}`}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-medium">{t.title || t.type}</span>
                <span className="text-[13px] text-muted">
                  {t.type} · {shortDate.format(new Date(`${t.date}T00:00:00Z`))}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className={`text-base font-semibold tabular-nums ${t.upcoming ? "text-muted" : ""}`}>−{formatCOP(t.amount)}</span>
                <span className="flex gap-1">
                  {t.upcoming && <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-semibold text-accent">Pago futuro</span>}
                  <span className="rounded-full bg-fill px-2 py-0.5 text-[11px] font-semibold text-ink-2">{t.platform}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(t.id, `${t.title || t.type} · ${formatCOP(t.amount)}`)}
                aria-label={`Borrar ${t.title || t.type}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-danger transition active:scale-90 active:bg-danger/10"
              >
                {busyId === t.id ? <Spinner /> : <Trash />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Wishlist({ items }) {
  const { remove, busyId, dialog } = useRemove(deleteWish, { title: "¿Quitar de la lista de deseos?", done: "Quitado de la lista" });

  return (
    <section aria-labelledby="deseos" className="flex flex-col gap-3">
      {dialog}
      <div className="flex items-center justify-between px-1">
        <h2 id="deseos" className="text-xl font-bold tracking-tight">Lista de deseos</h2>
        <Link href="/juegos/deseo" aria-label="Agregar a la lista de deseos" className="flex min-h-9 items-center gap-1 rounded-full bg-accent/10 px-3.5 text-[15px] font-semibold text-accent transition active:scale-95">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Agregar
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">Guarda juegos que quieres y el precio al que los comprarías.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-card">
          {items.map((w) => {
            const reached = w.target != null && w.current <= w.target;
            return (
              <li key={w.id} className={`flex items-center gap-3 border-t border-line py-3 pr-2 pl-4 first:border-t-0 ${busyId === w.id ? "opacity-40" : ""}`}>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-medium">{w.title}</span>
                  <span className={`text-[13px] ${reached ? "font-semibold text-ok" : "text-muted"}`}>
                    {w.platform} · {w.target == null ? "Sin precio objetivo" : reached ? "¡Llegó a tu precio!" : `Comprar a ${formatCOP(w.target)}`}
                  </span>
                </span>
                <span className="text-base font-semibold tabular-nums">{formatCOP(w.current)}</span>
                <button
                  type="button"
                  onClick={() => remove(w.id, w.title)}
                  aria-label={`Quitar ${w.title}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-danger transition active:scale-90 active:bg-danger/10"
                >
                  {busyId === w.id ? <Spinner /> : <Trash />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
