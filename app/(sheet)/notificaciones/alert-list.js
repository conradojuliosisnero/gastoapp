"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markAlertsRead } from "./actions";

const ICONS = {
  pago: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  presupuesto: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
};

function Row({ a, isNew }) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link href={a.href} className={`flex items-start gap-3 px-4 py-3 transition-colors active:bg-fill ${isNew ? "bg-accent/5" : ""}`}>
        <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${a.kind === "presupuesto" ? "bg-warn/15 text-warn" : "bg-accent/12 text-accent"} ${isNew ? "" : "opacity-60"}`}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[a.kind]}</svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`text-base ${isNew ? "font-semibold" : "font-medium text-ink-2"}`}>{a.title}</span>
          <span className="text-[14px] text-muted">{a.body}</span>
        </span>
        {isNew && (
          <span className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-accent">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            Nueva
          </span>
        )}
      </Link>
    </li>
  );
}

// Keeps the "Nueva" marks for this visit while the server records them as read.
export default function AlertList({ alerts }) {
  const [fresh] = useState(() => new Set(alerts.filter((a) => !a.read).map((a) => a.id)));
  useEffect(() => {
    if (fresh.size) markAlertsRead([...fresh]);
  }, [fresh]);

  const unread = alerts.filter((a) => fresh.has(a.id));
  const seen = alerts.filter((a) => !fresh.has(a.id));
  return (
    <>
      {unread.length > 0 && (
        <section aria-labelledby="nuevas" className="flex flex-col gap-1.5">
          <h2 id="nuevas" className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Nuevas</h2>
          <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-line/70">
            {unread.map((a) => <Row key={a.id} a={a} isNew />)}
          </ul>
        </section>
      )}
      {seen.length > 0 && (
        <section aria-labelledby="leidas" className="flex flex-col gap-1.5">
          <h2 id="leidas" className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Leídas</h2>
          <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-line/70">
            {seen.map((a) => <Row key={a.id} a={a} isNew={false} />)}
          </ul>
        </section>
      )}
    </>
  );
}
