import { useEffect, useRef, useState } from "react";

interface SliderLabel {
  text: string;
  bgColor: string;
  textColor: string;
}

interface BeforeAfterSliderProps {
  gradedSrc: string;
  rawSrc: string;
  alt: string;
  className?: string;
  testId?: string;
  beforeLabel?: SliderLabel;
  afterLabel?: SliderLabel;
  sliderColor?: string;
}

export const BeforeAfterSlider = ({
  gradedSrc,
  rawSrc,
  alt,
  className = "",
  testId,
  beforeLabel = { text: "Raw footage", bgColor: "#000000", textColor: "#b3b3b3" },
  afterLabel = { text: "Color graded", bgColor: "#000000", textColor: "#e6e6e6" },
  sliderColor = "#ffffff",
}: BeforeAfterSliderProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const gradeRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef(false);
  const posRef = useRef(50);
  const rafRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const [, setTouched] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  const paint = (pct: number) => {
    const wrap = wrapRef.current;
    const cursor = cursorRef.current;
    if (!wrap || !cursor) return;
    const clamped = Math.min(97, Math.max(3, pct));
    cursor.style.transform = `translate3d(${((wrap.offsetWidth * clamped) / 100).toFixed(1)}px, 0, 0)`;
    if (gradeRef.current) {
      gradeRef.current.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    }
  };

  const schedule = (pct: number) => {
    posRef.current = pct;
    pendingRef.current = pct;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const next = pendingRef.current;
        pendingRef.current = null;
        if (next != null) paint(next);
      });
    }
  };

  useEffect(() => {
    paint(50);
    const onResize = () => paint(posRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pctFrom = (clientX: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return posRef.current;
    const rect = wrap.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activeRef.current = true;
    setTouched(true);
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    schedule(pctFrom(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    e.stopPropagation();
    schedule(pctFrom(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activeRef.current = false;
    setGrabbing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTouched(true);
      schedule(posRef.current - step);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setTouched(true);
      schedule(posRef.current + step);
    }
  };

  return (
    <div
      ref={wrapRef}
      data-testid={testId}
      className={`relative overflow-hidden select-none touch-none ${
        grabbing ? "cursor-grabbing" : "cursor-ew-resize"
      } ${className}`}
    >
      <img
        src={rawSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <img
        ref={gradeRef}
        src={gradedSrc}
        alt={alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: "inset(0 50% 0 0)" }}
      />

      <span
        className="absolute top-3 left-3 z-10 font-mono text-[10px] tracking-[0.22em] uppercase backdrop-blur px-2.5 py-1.5 rounded-md pointer-events-none"
        style={{ backgroundColor: `${afterLabel.bgColor}80`, color: afterLabel.textColor }}
      >
        {afterLabel.text}
      </span>
      <span
        className="absolute top-3 right-3 z-10 font-mono text-[10px] tracking-[0.22em] uppercase backdrop-blur px-2.5 py-1.5 rounded-md pointer-events-none"
        style={{ backgroundColor: `${beforeLabel.bgColor}80`, color: beforeLabel.textColor }}
      >
        {beforeLabel.text}
      </span>

      <div ref={cursorRef} className="absolute inset-0 z-20 pointer-events-none will-change-transform">
        <div
          className="absolute inset-y-0 left-0 w-[2px] -ml-px"
          style={{
            backgroundColor: sliderColor,
            boxShadow:
              "0 0 10px rgba(255,255,255,0.9), 0 0 30px rgba(153,219,255,0.5)",
          }}
        />
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`h-4 w-4 rounded-full transition-transform duration-200 ${
              grabbing ? "scale-90" : "scale-100"
            }`}
            style={{ backgroundColor: sliderColor, boxShadow: "0 0 14px rgba(153,219,255,0.85)" }}
          />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison — hold and move the white line"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(posRef.current)}
          data-testid={testId ? `${testId}-handle` : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="absolute inset-y-0 -left-6 w-12 cursor-ew-resize touch-none"
          style={{ pointerEvents: "auto" }}
        />
      </div>

    </div>
  );
};

export default BeforeAfterSlider;
