import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BOOT_KEY = "nm-portfolio-booted";

export const BootLoader = ({ onDone }: { onDone: () => void }) => {
  const [skipped] = useState(() => sessionStorage.getItem(BOOT_KEY) === "1");
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (skipped) {
      onDone();
      return;
    }
    document.body.style.overflow = "hidden";
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const start = performance.now();
    const DURATION = 1550;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        timers.push(setTimeout(() => setExiting(true), 300));
        timers.push(
          setTimeout(() => {
            sessionStorage.setItem(BOOT_KEY, "1");
            document.body.style.overflow = "";
            onDone();
          }, 1150),
        );
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (skipped) return null;

  return (
    <motion.div
      data-testid="boot-loader"
      className="fixed inset-0 z-[200] bg-ink flex flex-col justify-between p-6 sm:p-10"
      initial={{ y: 0 }}
      animate={exiting ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
    >
      <p
        data-testid="boot-loader-label"
        className="font-mono text-caption uppercase text-mist/80"
      >
        NAMISH MEHRA — LOADING THE PORTFOLIO
      </p>

      <div className="flex items-end justify-between gap-6">
        <div className="h-px flex-1 bg-white/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-trio"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          data-testid="boot-loader-counter"
          className="font-mono text-6xl sm:text-8xl font-medium text-slate-100 tabular-nums leading-none"
        >
          {String(pct).padStart(3, "0")}
        </span>
      </div>
    </motion.div>
  );
};

export default BootLoader;
