"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { subscribeToasts } from "@/lib/toast";

gsap.registerPlugin(useGSAP);

const VISIBLE_MS = 2800;

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => subscribeToasts((item) => setItems((list) => [...list.slice(-2), item])), []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-50 mx-auto flex w-[calc(100%-32px)] max-w-[416px] flex-col items-center gap-2"
    >
      {items.map((item) => (
        <Toast key={item.id} item={item} onDone={() => setItems((list) => list.filter((t) => t.id !== item.id))} />
      ))}
    </div>
  );
}

function Toast({ item, onDone }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap
        .timeline({ onComplete: onDone })
        .from(ref.current, { y: -24, opacity: 0, scale: 0.96, duration: reduce ? 0 : 0.35, ease: "back.out(1.6)" })
        .to(ref.current, { y: -12, opacity: 0, duration: reduce ? 0 : 0.25, ease: "power2.in" }, `+=${VISIBLE_MS / 1000}`);
    },
    { scope: ref }
  );

  const error = item.type === "error";
  return (
    <div
      ref={ref}
      className="flex items-center gap-2.5 rounded-full border border-glass-edge bg-glass py-2.5 pr-5 pl-3.5 text-[15px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl backdrop-saturate-[1.8]"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={error ? "text-danger" : "text-ok"}>
        {error ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5v.01" /></> : <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.5 2.5L16 9.5" /></>}
      </svg>
      {item.message}
    </div>
  );
}
