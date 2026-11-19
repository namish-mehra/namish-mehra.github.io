import type Lenis from "lenis";

export const lenisRef: { current: Lenis | null } = { current: null };

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(hash: string) {
  const el = document.querySelector(hash) as HTMLElement | null;
  if (!el) return;
  if (lenisRef.current) {
    lenisRef.current.scrollTo(el, { offset: -76, duration: 1.25 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}
