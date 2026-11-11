"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "@/lib/toast";
import Spinner from "@/app/spinner";
import { revealSalary } from "./actions";

gsap.registerPlugin(useGSAP);

const REVEAL_MS = 5000;

export function SalaryValue({ masked }) {
  const [shown, setShown] = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(null), REVEAL_MS);
    return () => {
      clearTimeout(id);
      setShown(null); // also when the screen is hidden by navigation
    };
  }, [shown]);

  return (
    <span className="flex items-center gap-1">
      <span className="font-semibold tabular-nums" aria-live="polite">{shown ?? masked}</span>
      <button
        type="button"
        aria-label={shown ? "Ocultar sueldo" : "Mostrar sueldo"}
        disabled={pending}
        onClick={() =>
          shown
            ? setShown(null)
            : startTransition(async () => {
                const result = await revealSalary();
                result.error ? toast(result.error, "error") : setShown(result.value);
              })
        }
        className="-mr-2 flex size-10 items-center justify-center rounded-full text-accent transition active:scale-90 active:bg-accent/10"
      >
        {pending ? (
          <Spinner />
        ) : (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {shown ? (
              <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-2.4 3.4M6.1 6.1C3.9 7.6 2.5 9.8 2 12c1 2.5 5 7 10 7a9.6 9.6 0 0 0 4-.9" /></>
            ) : (
              <><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></>
            )}
          </svg>
        )}
      </button>
    </span>
  );
}

// Last months' savings as bars; negative months grow down in orange.
export function SavingsBars({ months }) {
  const ref = useRef(null);
  const max = Math.max(1, ...months.map((m) => Math.abs(m.saved)));

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".bar", { scaleY: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 });
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} role="img" aria-label={`Ahorro por mes: ${months.map((m) => `${m.label} ${m.text}`).join(", ")}`} className="grid h-32 grid-cols-6 items-end gap-2">
      {months.map((m) => (
        <div key={m.period} aria-hidden="true" className="flex h-full flex-col items-center justify-end gap-1.5">
          <div
            className={`bar w-full rounded-md ${m.saved < 0 ? "origin-top bg-warn" : "origin-bottom bg-ok"}`}
            style={{ height: `${Math.max(4, Math.round((Math.abs(m.saved) / max) * 96))}px` }}
          />
          <span className="text-[11px] text-muted">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
