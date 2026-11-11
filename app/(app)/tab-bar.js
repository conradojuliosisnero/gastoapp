"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const ICON = {
  inicio: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  internet: <><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><path d="M2 9a15 15 0 0 1 20 0" /><circle cx="12" cy="19.5" r="1" /></>,
  gastos: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></>,
  juegos: <path d="M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.3A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4z" />,
};

const TABS = [
  { href: "/inicio", label: "Inicio", icon: ICON.inicio },
  { href: "/internet", label: "Internet", icon: ICON.internet },
  { href: "/gastos", label: "Gastos", icon: ICON.gastos },
  { href: "/juegos", label: "Juegos", icon: ICON.juegos },
];

export default function TabBar() {
  const pathname = usePathname();
  const active = TABS.findIndex((t) => pathname.startsWith(t.href));
  const nav = useRef(null);
  const pill = useRef(null);
  const mounted = useRef(false);

  useGSAP(
    () => {
      if (active < 0) return;
      const instant = !mounted.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
      mounted.current = true;
      gsap.to(pill.current, { xPercent: active * 100, duration: instant ? 0 : 0.45, ease: "power3.out" });
    },
    { dependencies: [active], scope: nav }
  );

  return (
    <div className="fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-20 mx-auto flex w-[calc(100%-32px)] max-w-[416px] items-center gap-3">
    <nav ref={nav} aria-label="Navegación principal" className="flex-1">
      <div className="relative grid h-16 grid-cols-4 rounded-full border border-glass-edge bg-glass p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12),inset_0_1px_0_var(--glass-edge)] backdrop-blur-xl backdrop-saturate-[1.8]">
        <span
          ref={pill}
          aria-hidden="true"
          className={`absolute inset-y-1.5 left-1.5 w-[calc((100%-12px)/4)] rounded-full bg-accent/12 ${active < 0 ? "opacity-0" : ""}`}
        />
        {TABS.map((tab, i) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={i === active ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium text-ink-2 transition-colors aria-[current=page]:font-semibold aria-[current=page]:text-accent"
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
    {/* shortcut: always opens a new expense; point it per tab when Internet and Juegos get their own forms. */}
    <Link
      href="/gastos/nuevo"
      aria-label="Agregar gasto"
      className="flex size-16 shrink-0 items-center justify-center rounded-full border border-white/35 bg-primary/90 text-white shadow-[0_10px_30px_rgba(10,102,216,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl transition-transform active:scale-95"
    >
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14" /><path d="M5 12h14" />
      </svg>
    </Link>
    </div>
  );
}
