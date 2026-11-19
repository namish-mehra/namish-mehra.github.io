import { useReducedMotion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  variant?: "divider" | "footer";
  duration?: number;
  testId?: string;
}

export const Marquee = ({ items, variant = "divider", duration = 50, testId }: MarqueeProps) => {
  const reduce = useReducedMotion();
  const repeats = variant === "divider" ? 4 : 2;

  const Row = ({ hidden = false }: { hidden?: boolean }) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {Array.from({ length: repeats }).map((_, r) =>
        items.map((item, i) => (
          <span key={`${r}-${item}-${i}`} className="flex items-center shrink-0">
            {variant === "divider" ? (
              <span className="mx-7 font-mono text-[11px] tracking-[0.3em] uppercase text-white/45 whitespace-nowrap">
                {item}
              </span>
            ) : (
              <span className="mx-8 font-heading font-extrabold text-[clamp(2.75rem,7vw,7.25rem)] leading-none whitespace-nowrap text-outline">
                {item}
              </span>
            )}
            <span
              aria-hidden="true"
              className={
                variant === "divider"
                  ? "h-1 w-1 rounded-full bg-trio shrink-0"
                  : "h-2 w-2 rounded-full bg-trio opacity-40 shrink-0"
              }
            />
          </span>
        )),
      )}
    </div>
  );

  return (
    <div
      data-testid={testId}
      className={`group relative flex w-full overflow-hidden mask-fade-x ${
        variant === "divider"
          ? "border-y border-white/[0.05] bg-white/[0.015] py-4"
          : "py-10 md:py-14"
      }`}
    >
      <div
        className={`flex w-max will-change-transform ${
          reduce ? "" : "animate-marquee group-hover:[animation-play-state:paused]"
        }`}
        style={reduce ? undefined : { animationDuration: `${duration}s` }}
      >
        <Row />
        <Row hidden />
      </div>
    </div>
  );
};

export default Marquee;
