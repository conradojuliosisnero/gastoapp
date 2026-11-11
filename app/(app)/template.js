"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { stagger } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

// template.js re-mounts on every navigation, so each screen gets its entrance.
export default function Template({ children }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, { opacity: 0, y: 12, duration: 0.35, ease: "power2.out", clearProps: "all" });
        ref.current.querySelectorAll("[data-stagger]").forEach((list) => stagger(list));
      });
    },
    { scope: ref }
  );

  return <div ref={ref}>{children}</div>;
}
