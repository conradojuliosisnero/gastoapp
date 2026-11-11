"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/money";
import { deleteTransaction } from "./actions";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "fijo", label: "Fijos" },
  { id: "variable", label: "Variables" },
];

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

export default function Movements({ movements }) {
  const [filter, setFilter] = useState("todos");
  const visible = filter === "todos" ? movements : movements.filter((m) => m.kind === filter);

  return (
    <>
      <div role="group" aria-label="Filtrar movimientos" className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="min-h-9 rounded-full bg-card px-4 text-sm font-semibold aria-pressed:bg-ink aria-pressed:text-white"
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
            <li key={m.id} className="flex items-center gap-3 border-t border-line py-3 pr-2 pl-4 first:border-t-0">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-medium">{m.description || m.category}</span>
                <span className="text-[13px] text-muted">
                  {m.category} · {shortDate.format(new Date(`${m.date}T00:00:00Z`))}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-base font-semibold">−{formatCOP(m.amount)}</span>
                <span className="rounded-full bg-[#eeeef0] px-2 py-0.5 text-[11px] font-semibold text-[#3a3a3c]">{m.kind === "fijo" ? "Fijo" : "Variable"}</span>
              </span>
              <form
                action={deleteTransaction}
                onSubmit={(e) => {
                  if (!confirm(`¿Borrar "${m.description || m.category}" por ${formatCOP(m.amount)}?`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" aria-label={`Borrar ${m.description || m.category}`} className="flex size-11 items-center justify-center rounded-full text-muted active:bg-line">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" />
                  </svg>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
