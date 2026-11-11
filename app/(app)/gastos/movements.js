"use client";

import { useState, useTransition } from "react";
import { formatCOP } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";
import { copyFixedFromPreviousMonth, deleteTransaction } from "./actions";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "fijo", label: "Fijos" },
  { id: "variable", label: "Variables" },
];

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

export default function Movements({ movements }) {
  const [filter, setFilter] = useState("todos");
  const [deletingId, setDeletingId] = useState(null);
  const [, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();
  const visible = filter === "todos" ? movements : movements.filter((m) => m.kind === filter);

  async function remove(m) {
    const label = m.description || m.category;
    const ok = await confirm({ title: "¿Borrar este gasto?", message: `${label} · ${formatCOP(m.amount)}`, confirmLabel: "Borrar", destructive: true });
    if (!ok) return;
    setDeletingId(m.id);
    startTransition(async () => {
      const result = await deleteTransaction(m.id);
      setDeletingId(null);
      result.error ? toast(result.error, "error") : toast("Gasto borrado");
    });
  }

  return (
    <>
      {confirmDialog}
      <div role="group" aria-label="Filtrar movimientos" className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="min-h-9 rounded-full border border-line bg-card px-4 text-sm font-semibold transition active:scale-95 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-[15px] text-muted">
          {movements.length === 0 ? "Aún no hay movimientos este mes. Toca + para agregar uno." : "No hay movimientos con este filtro."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-card">
          {visible.map((m) => (
            <li key={m.id} className={`flex items-center gap-3 border-t border-line py-3 pr-2 pl-4 transition-opacity first:border-t-0 ${deletingId === m.id ? "opacity-40" : ""}`}>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-medium">{m.description || m.category}</span>
                <span className="text-[13px] text-muted">
                  {m.category} · {shortDate.format(new Date(`${m.date}T00:00:00Z`))}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className={`text-base font-semibold tabular-nums ${m.upcoming ? "text-muted" : ""}`}>−{formatCOP(m.amount)}</span>
                <span className="flex gap-1">
                  {m.upcoming && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      Pago futuro
                    </span>
                  )}
                  <span className="rounded-full bg-fill px-2 py-0.5 text-[11px] font-semibold text-ink-2">{m.kind === "fijo" ? "Fijo" : "Variable"}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(m)}
                disabled={deletingId === m.id}
                aria-label={`Borrar ${m.description || m.category}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-danger transition active:scale-90 active:bg-danger/10"
              >
                {deletingId === m.id ? (
                  <Spinner />
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function CopyFixedButton({ mes, count }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3">
      <span className="text-[15px] text-muted">El mes pasado tuviste {count} {count === 1 ? "gasto fijo" : "gastos fijos"}.</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await copyFixedFromPreviousMonth(mes);
            result.error ? toast(result.error, "error") : toast(result.count === 1 ? "1 gasto fijo copiado" : `${result.count} gastos fijos copiados`);
          })
        }
        className="flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-70"
      >
        {pending && <Spinner />}
        Copiarlos
      </button>
    </div>
  );
}
