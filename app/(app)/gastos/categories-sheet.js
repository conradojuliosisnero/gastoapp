"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { formatCOP } from "@/lib/money";

// Compact row that opens the per-category breakdown in a bottom sheet, so the movement list stays in view.
export default function CategoriesSheet({ rows }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const overCount = rows.filter((r) => r.over).length;
  const withSpend = rows.filter((r) => r.spent > 0).length;

  useEffect(() => {
    const dialog = ref.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    dialog.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(dialog, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" });
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card px-4 text-left transition active:scale-[0.99] active:bg-fill"
      >
        <span className="flex flex-1 flex-col">
          <span className="text-base font-semibold">Por categoría</span>
          <span className="text-[13px] text-muted">
            {withSpend} con gastos
            {overCount > 0 && <span className="font-semibold text-warn"> · {overCount === 1 ? "1 excedida" : `${overCount} excedidas`}</span>}
          </span>
        </span>
        <span className="text-[15px] font-semibold text-accent">Ver</span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <dialog
        ref={ref}
        aria-labelledby="categorias-titulo"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-md rounded-t-[22px] bg-bg p-0 text-ink backdrop:bg-black/40"
      >
        {open && (
          <div className="flex max-h-[85dvh] flex-col">
            <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-9 rounded-full bg-switch" />
            <div className="flex items-center justify-between px-4 pt-2 pb-3">
              <h2 id="categorias-titulo" className="text-[17px] font-semibold">Por categoría</h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 text-[17px] font-semibold text-accent">
                Listo
              </button>
            </div>
            <ul className="mx-4 flex-1 overflow-y-auto rounded-2xl bg-card">
              {rows.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 border-t border-line px-4 py-3 first:border-t-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-medium">{c.name}</span>
                    <span className={`text-sm font-semibold tabular-nums ${c.over ? "text-warn" : ""}`}>
                      {formatCOP(c.spent)}
                      {c.budget != null && <span className="font-normal text-muted"> / {formatCOP(c.budget)}</span>}
                    </span>
                  </div>
                  {c.budget != null && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div className={`h-1.5 rounded-full ${c.over ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.min(100, Math.round((c.spent / c.budget) * 100))}%` }} />
                    </div>
                  )}
                  {c.over && <span className="text-xs font-semibold text-warn">Excedido por {formatCOP(c.spent - c.budget)}</span>}
                </li>
              ))}
            </ul>
            <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
              <Link
                href="/gastos/presupuesto"
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-primary text-[17px] font-semibold text-white transition active:scale-[0.98]"
              >
                Ajustar presupuestos
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
