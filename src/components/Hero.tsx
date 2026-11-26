import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useContent } from "@/lib/store";
import { scrollToSection } from "@/lib/scroll";
import { Magnetic } from "@/components/Magnetic";

interface HeroProps {
  booted: boolean;
}

/*
 * Hero orbit rings: three true ovals (from figma/hero-orbit-rings.svg).
 * Each ring keeps its own start angle and turns around the centre.
 */
const RINGS = [
  { rx: 468, ry: 365.04, color: "#99dbff", opacity: 0.3, start: -18, duration: 44, reverse: false },
  { rx: 360, ry: 223.2, color: "#99a8ff", opacity: 0.24, start: 32, duration: 32, reverse: true },
  { rx: 270, ry: 229.5, color: "#99fff0", opacity: 0.2, start: -62, duration: 58, reverse: false },
];

const OrbitRings = () => (
  <svg
    className="absolute inset-0 w-full h-full overflow-visible"
    viewBox="0 0 960 960"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <filter id="orbit-glow" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {RINGS.map((r) => (
      <g key={r.color} transform={`rotate(${r.start} 480 480)`}>
        <g
          className={r.reverse ? "animate-orbit-rev" : "animate-orbit"}
          style={{ transformOrigin: "480px 480px", transformBox: "view-box", animationDuration: `${r.duration}s` }}
        >
          <ellipse cx="480" cy="480" rx={r.rx} ry={r.ry} stroke={r.color} strokeOpacity={r.opacity} strokeWidth="1" />
          <circle cx="480" cy={480 - r.ry} r="6" fill={r.color} filter="url(#orbit-glow)" />
        </g>
      </g>
    ))}
  </svg>
);

export const Hero = ({ booted }: HeroProps) => {
  const { settings } = useContent();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const nameY = useTransform(scrollY, [0, 700], [0, 48]);

  const lineAnim = (i: number) => ({
    initial: { y: "115%" },
    animate: booted ? { y: "0%" } : { y: "115%" },
    transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] as const, delay: 0.12 + i * 0.14 },
  });

  const fadeAnim = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: booted ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay },
  });

  return (
    <section
      id="home"
      data-testid="hero-section"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 24%, rgba(0,48,73,0.4), transparent 58%)",
        }}
      />

      <div className="relative max-w-[1760px] mx-auto w-full px-5 sm:px-8 pt-32 pb-28 grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
        <div className="lg:col-span-9">
          <motion.div {...fadeAnim(0.05)} className="flex items-center gap-3 mb-7">
            <span className="h-1.5 w-1.5 rounded-full bg-trio animate-pulse-dot" />
            <p className="font-mono text-caption uppercase text-mist/80">
              {settings.heroEyebrow}
            </p>
          </motion.div>

          <motion.h1
            style={reduce ? undefined : { y: nameY }}
            className="font-heading font-extrabold text-hero text-slate-100"
            data-testid="hero-name-title"
          >
            <span className="block overflow-hidden pb-1">
              <motion.span className="block will-change-transform" {...lineAnim(0)}>
                NAMISH
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span className="block will-change-transform text-gradient" {...lineAnim(1)}>
                MEHRA
              </motion.span>
            </span>
          </motion.h1>

          <motion.p
            {...fadeAnim(0.55)}
            data-testid="hero-tagline"
            className="mt-7 font-body text-body text-slate-300 max-w-md"
          >
            {settings.heroTagline}
          </motion.p>

          <motion.div {...fadeAnim(0.7)} className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic>
              <button
                data-testid="hero-cta-work"
                onClick={() => scrollToSection("#work")}
                className="group inline-flex items-center gap-2 rounded-full bg-trio px-7 py-3.5 font-mono text-[12px] tracking-[0.2em] uppercase text-ink transition-shadow duration-300 hover:shadow-[0_0_36px_rgba(153,168,255,0.55)]"
              >
                See selected work
                <ArrowDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </Magnetic>
            <Magnetic>
              <button
                data-testid="hero-cta-contact"
                onClick={() => scrollToSection("#contact")}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 font-mono text-[12px] tracking-[0.2em] uppercase text-slate-200 transition-all duration-300 hover:border-transparent hover:bg-white/[0.04] hover:shadow-[0_0_28px_rgba(153,255,240,0.25)] relative"
              >
                <span className="absolute inset-0 rounded-full bg-trio opacity-0 group-hover:opacity-[0.12] transition-opacity duration-300" />
                Start a project
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </Magnetic>
          </motion.div>
        </div>

        <motion.div
          {...fadeAnim(0.6)}
          className="hidden lg:block lg:col-span-3 relative"
          data-testid="hero-orbit-graphic"
        >
          <div className="relative h-[560px]">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[960px] h-[960px]" aria-hidden="true">
              <OrbitRings />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        {...fadeAnim(0.95)}
        className="absolute bottom-6 inset-x-0 px-5 sm:px-8"
      >
        <div className="flex items-end justify-between gap-6">
          <p className="hidden sm:block font-mono text-caption uppercase text-slate-500 leading-loose">
            Motion Designer<br />& Video Editor
          </p>
          <p className="hidden sm:block font-mono text-caption uppercase text-slate-500 text-right leading-loose">
            Edit /<br />Craft /<br />Attention
          </p>
        </div>
        <div
          data-testid="hero-scroll-indicator"
          className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center gap-3"
        >
          <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-slate-500">
            Scroll
          </span>
          <span className="w-px h-11 bg-trio animate-scroll-cue" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
