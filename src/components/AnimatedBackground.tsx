import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll";

interface Blob {
  parallax: number;
  pos: React.CSSProperties;
  inner: React.CSSProperties;
  anim: string;
}

const BLOBS: Blob[] = [
  {
    parallax: 0.05,
    pos: { top: "-14%", left: "-12%", width: "58vw", height: "58vw" },
    inner: {
      background: "radial-gradient(circle at center, rgba(0,48,73,0.85), transparent 66%)",
      opacity: 0.22,
    },
    anim: "animate-drift-a",
  },
  {
    parallax: 0.13,
    pos: { top: "6%", right: "-16%", width: "52vw", height: "52vw" },
    inner: {
      background: "radial-gradient(circle at center, rgba(153,168,255,0.6), transparent 64%)",
      opacity: 0.17,
    },
    anim: "animate-drift-b",
  },
  {
    parallax: 0.09,
    pos: { bottom: "-20%", left: "16%", width: "50vw", height: "50vw" },
    inner: {
      background: "radial-gradient(circle at center, rgba(153,255,240,0.5), transparent 64%)",
      opacity: 0.14,
    },
    anim: "animate-drift-c",
  },
];

const PALETTE = ["#99dbff", "#99a8ff", "#99fff0"];
const ACCENTS = ["#ffd9a0", "#ffb3c7"];

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  c: string;
  a: number;
  ph: number;
  sp: number;
  glow: boolean;
}

export const AnimatedBackground = () => {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      layerRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(0, ${(-y * BLOBS[i].parallax).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    let w = 0;
    let h = 0;
    let raf = 0;
    let parts: Particle[] = [];

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(1400, Math.round((w * h) / 1100));
      parts = Array.from({ length: count }, () => {
        const warm = Math.random() < 0.08;
        const big = Math.random() < 0.12;
        return {
          x: rand(0, w),
          y: rand(0, h),
          r: big ? rand(1.6, 2.6) : rand(0.5, 1.3),
          vx: rand(-40, 40),
          vy: rand(-40, 40),
          c: warm
            ? ACCENTS[Math.floor(rand(0, ACCENTS.length))]
            : PALETTE[Math.floor(rand(0, PALETTE.length))],
          a: rand(0.25, 0.9),
          ph: rand(0, Math.PI * 2),
          sp: rand(0.4, 1.4),
          glow: big,
        };
      });
    };

    const sprites: Record<string, HTMLCanvasElement> = {};
    const sprite = (color: string) => {
      let s = sprites[color];
      if (!s) {
        s = document.createElement("canvas");
        s.width = 48;
        s.height = 48;
        const sc = s.getContext("2d");
        if (sc) {
          const g = sc.createRadialGradient(24, 24, 0, 24, 24, 24);
          g.addColorStop(0, color);
          g.addColorStop(0.2, color);
          g.addColorStop(0.5, `${color}44`);
          g.addColorStop(1, "transparent");
          sc.fillStyle = g;
          sc.fillRect(0, 0, 48, 48);
        }
        sprites[color] = s;
      }
      return s;
    };

    const draw = (dt: number, t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -4) p.x = w + 4;
        else if (p.x > w + 4) p.x = -4;
        if (p.y < -4) p.y = h + 4;
        else if (p.y > h + 4) p.y = -4;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(p.ph + t * p.sp));
        if (p.glow) {
          const size = p.r * 8;
          ctx.drawImage(sprite(p.c), p.x - size / 2, p.y - size / 2, size, size);
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    if (prefersReducedMotion()) {
      build();
      draw(0, 0);
      return;
    }

    build();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="animated-background"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={blob.pos}
        >
          <div
            className={`w-full h-full rounded-full blur-[115px] ${blob.anim}`}
            style={blob.inner}
          />
        </div>
      ))}
      <canvas
        ref={canvasRef}
        data-testid="particle-field"
        className="absolute inset-0"
        style={{ opacity: 0.85 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(5,8,11,0.55) 100%)",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
