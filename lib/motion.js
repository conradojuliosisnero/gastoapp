import gsap from "gsap";

// Small GSAP helpers for micro-interactions. All of them do nothing when the user asks for reduced motion.
export const calm = () => typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Springy "tap landed" feedback (chips, payment marked).
export function pop(el) {
  if (!el || calm()) return;
  gsap.fromTo(el, { scale: 0.86 }, { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" });
}

// Slides a list row out and closes the gap before it is deleted. Resolves when done.
export function collapse(el) {
  if (!el || calm()) return Promise.resolve();
  return gsap
    .timeline()
    .to(el, { x: -32, opacity: 0, duration: 0.22, ease: "power2.in" })
    .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, borderTopWidth: 0, duration: 0.22, ease: "power2.inOut" })
    .then();
}

// Puts a collapsed row back (e.g. the delete failed).
export const restore = (el) => el && gsap.set(el, { clearProps: "all" });

// Rows of a list rise in one after another.
export function stagger(container, selector = ":scope > *") {
  if (!container || calm()) return;
  gsap.from(container.querySelectorAll(selector), { opacity: 0, y: 10, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "all" });
}
