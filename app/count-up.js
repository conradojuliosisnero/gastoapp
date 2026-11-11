"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { formatMoney } from "@/lib/money";
import { calm } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

// A money figure that counts up to its value, and from the old value when it changes.
export default function CountUp({ value, currency = "COP", prefix = "", className }) {
  const ref = useRef(null);
  const last = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      const show = (n) => (el.textContent = prefix + formatMoney(Math.round(n), currency));
      const from = last.current;
      last.current = value;
      if (calm() || from === value) return show(value);
      const counter = { n: from };
      gsap.to(counter, { n: value, duration: 0.8, ease: "power3.out", onUpdate: () => show(counter.n) });
    },
    { dependencies: [value] }
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatMoney(value, currency)}
    </span>
  );
}
