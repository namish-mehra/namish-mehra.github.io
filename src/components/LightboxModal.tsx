import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import type { LightboxTarget } from "@/components/SelectedWork";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { asset, getYoutubeEmbedUrl } from "@/lib/content";

interface LightboxModalProps {
  target: LightboxTarget | null;
  onClose: () => void;
}

export const LightboxModal = ({ target, onClose }: LightboxModalProps) => {
  const isVideo = target?.mode === "video";
  const isVertical = target?.project.aspect !== "16:9";

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  return (
    <motion.div
      data-testid="video-lightbox-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        data-testid="lightbox-backdrop"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(5,7,10,0.72)", backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)" }}
      />

      <button
        data-testid="lightbox-close-button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-300 hover:border-transparent hover:bg-trio hover:text-ink"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div
        className="relative z-10"
        style={
          isVideo && isVertical
            ? { width: "min(92vw, calc(80vh * 9 / 16))" }
            : { width: "min(70vw, calc(70vh * 16 / 9))" }
        }
        initial={{ scale: 0.93, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {isVideo ? (
          <div
            className={`relative mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.7)] ${
              isVertical ? "aspect-[9/16]" : "aspect-video"
            }`}
            style={isVertical ? { maxHeight: "80vh" } : undefined}
          >
            <iframe
              data-testid="lightbox-video-player"
              src={getYoutubeEmbedUrl(target.project.youtubeUrl!)}
              title={target.project.title}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
            <BeforeAfterSlider
              gradedSrc={asset(target.project.afterImage)}
              rawSrc={asset(target.project.beforeImage)}
              beforeLabel={target.project.beforeLabel}
              afterLabel={target.project.afterLabel}
              sliderColor={target.project.sliderColor}
              alt={`${target.project.title} — graded vs raw`}
              className="aspect-video"
              testId="lightbox-grade-slider"
            />
          </div>
        )}

        <div className="mt-4 px-1">
          <div className="flex items-center justify-between gap-4">
            <p className="font-heading font-extrabold text-h3 text-slate-100">{target.project.title}</p>
            <p className="font-mono text-caption uppercase text-mist/70">{target.project.category}</p>
          </div>
          {target.project.description && (
            <p data-testid="lightbox-description" className="mt-1.5 text-sm text-slate-500">
              {target.project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">
              {target.project.tags.filter(Boolean).join(" · ")}
            </span>
            {target.project.duration && (
              <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400">
                {target.project.duration}
              </span>
            )}
            {isVideo && target.project.youtubeUrl && (
              <a
                data-testid="lightbox-request-link"
                href={target.project.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-trio px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(153,168,255,0.5)]"
              >
                Watch full video
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LightboxModal;

