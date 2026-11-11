"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const HEIGHT = 112;

// Six months of game spending; bars over the monthly limit turn orange, with a dashed line at the limit.
export default function MonthBars({ bars, limit, label = "Gasto en juegos por mes" }) {
  const ref = useRef(null);
  const max = Math.max(1, limit ?? 0, ...bars.map((b) => b.total));
  const limitY = limit != null ? Math.round((limit / max) * HEIGHT) : null;

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".bar", { scaleY: 0, transformOrigin: "bottom", duration: 0.6, ease: "power3.out", stagger: 0.06 });
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} role="img" aria-label={`${label}: ${bars.map((b) => `${b.label} ${b.text}`).join(", ")}`} className="relative">
      {limitY != null && (
        <div aria-hidden="true" className="absolute inset-x-0 border-t-[1.5px] border-dashed border-warn" style={{ bottom: `${limitY + 22}px` }} />
      )}
      <div aria-hidden="true" className="grid items-end gap-1.5" style={{ height: HEIGHT + 22, gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
        {bars.map((b) => (
          <div key={b.period} className="flex h-full flex-col items-center justify-end gap-1.5">
            <div className={`bar w-full rounded-md ${b.over ? "bg-warn" : "bg-accent"}`} style={{ height: `${Math.max(3, Math.round((b.total / max) * HEIGHT))}px` }} />
            <span className="text-[11px] text-muted">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
