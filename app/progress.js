"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { calm } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

// Thin progress bar that grows to its value.
export default function Progress({ pct, className = "bg-accent", label }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (!calm()) gsap.from(ref.current, { width: 0, duration: 0.9, ease: "power3.out" });
    },
    { dependencies: [pct] }
  );
  return (
    <div role={label ? "progressbar" : undefined} aria-label={label} aria-valuenow={label ? Math.round(pct) : undefined} className="h-2 overflow-hidden rounded-full bg-line">
      <div ref={ref} className={`h-2 rounded-full ${className}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
