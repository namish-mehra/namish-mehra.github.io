import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const inner = ringInnerRef.current;
    if (!dot || !ring || !inner) return;

    document.documentElement.classList.add("custom-cursor");
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactive = target?.closest(
        "a, button, [role='slider'], input, select, textarea, .cursor-ew-resize",
      );
      inner.style.transform = interactive ? "scale(1.7)" : "scale(1)";
      inner.style.borderColor = interactive
        ? "rgba(153,219,255,0.9)"
        : "rgba(255,255,255,0.55)";
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnter = () => {
      visible = true;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        data-testid="custom-cursor-ring"
        aria-hidden="true"
        className="fixed top-0 left-0 z-[300] pointer-events-none opacity-0 transition-opacity duration-300"
        style={{ marginLeft: -18, marginTop: -18 }}
      >
        <div
          ref={ringInnerRef}
          className="w-9 h-9 rounded-full border border-white/55 transition-all duration-200 ease-out"
        />
      </div>
      <div
        ref={dotRef}
        data-testid="custom-cursor-dot"
        aria-hidden="true"
        className="fixed top-0 left-0 z-[301] pointer-events-none opacity-0 transition-opacity duration-300"
        style={{ marginLeft: -4, marginTop: -4 }}
      >
        <div
          className="w-2 h-2 rounded-full bg-white"
          style={{ boxShadow: "0 0 8px rgba(153,219,255,0.8)" }}
        />
      </div>
    </>
  );
};

export default CustomCursor;
