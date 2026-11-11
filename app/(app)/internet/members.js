"use client";

import { useOptimistic, useTransition } from "react";
import { formatCOP } from "@/lib/money";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/app/confirm";
import { togglePayment } from "./actions";

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Members({ period, members }) {
  const [optimistic, setOptimistic] = useOptimistic(members, (list, id) => list.map((m) => (m.id === id ? { ...m, paid: !m.paid } : m)));
  const [, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();

  async function toggle(m) {
    if (m.paid) {
      const ok = await confirm({
        title: `¿Desmarcar el pago de ${m.isMe ? "tu parte" : m.name}?`,
        message: m.isMe ? "También se quitará de tus gastos." : "Quedará como pendiente este mes.",
        confirmLabel: "Desmarcar",
        destructive: true,
      });
      if (!ok) return;
    }
    startTransition(async () => {
      setOptimistic(m.id);
      const result = await togglePayment(m.id, period);
      if (result.error) return toast(result.error, "error");
      const who = m.isMe ? "Tu parte" : result.name;
      toast(result.paid ? `${who}: pago registrado` : `${who}: pago desmarcado`);
    });
  }

  return (
    <section aria-labelledby="integrantes" className="flex flex-col gap-2">
      {dialog}
      <h2 id="integrantes" className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Quién pagó</h2>
      <ul className="overflow-hidden rounded-2xl bg-card">
        {optimistic.map((m) => (
          <li key={m.id} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
            <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${m.isMe ? "bg-primary text-white" : "bg-fill text-ink-2"}`}>
              {m.isMe ? "Tú" : initials(m.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[17px] font-medium">{m.isMe ? `${m.name} (tú)` : m.name}</span>
              <span className="text-[13px] text-muted tabular-nums">
                {formatCOP(m.share)} · {m.paid ? "Pagado" : "Pendiente"}
              </span>
            </span>
            <button
              type="button"
              aria-pressed={m.paid}
              aria-label={`${m.paid ? "Desmarcar" : "Marcar"} pago de ${m.isMe ? "tu parte" : m.name}`}
              onClick={() => toggle(m)}
              className={`flex min-h-9 min-w-[104px] items-center justify-center gap-1 rounded-full px-3 text-[14px] font-semibold transition active:scale-95 ${
                m.paid ? "bg-ok/15 text-ok" : "bg-primary text-white"
              }`}
            >
              {m.paid && (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              )}
              {m.paid ? "Pagado" : "Marcar pago"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
