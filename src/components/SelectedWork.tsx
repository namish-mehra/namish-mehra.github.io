import { Maximize2, Play } from "lucide-react";
import { asset, resolveProject, visibleGrades, visibleVideos } from "@/lib/content";
import type { LayoutId, Project } from "@/lib/content";
import { useContent, useDevice } from "@/lib/store";
import { Reveal } from "@/components/Reveal";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

export interface LightboxTarget {
  mode: "video" | "grade";
  project: Project;
}

interface SelectedWorkProps {
  onOpen: (target: LightboxTarget) => void;
}

const GlowFrame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative group/frame ${className}`}>
    <div
      aria-hidden="true"
      className="absolute -inset-px rounded-2xl bg-trio opacity-0 blur-[7px] transition-opacity duration-500 group-hover/frame:opacity-60"
    />
    <div className="relative rounded-2xl p-[1.5px] bg-white/[0.07] transition-colors duration-500 group-hover/frame:bg-trio/60">
      <div className="relative rounded-[15px] overflow-hidden bg-panel h-full flex flex-col">
        {children}
      </div>
    </div>
  </div>
);

const VideoCard = ({ project, onOpen, layout }: { project: Project; onOpen: (t: LightboxTarget) => void; layout: LayoutId }) => {
  const wide = project.aspect === "16:9";
  const box = wide
    ? "aspect-video lg:aspect-auto lg:h-[620px]"
    : layout === "layout2"
      ? "aspect-[9/16] lg:aspect-[9/11]"
      : "aspect-[9/16] lg:aspect-auto lg:h-[620px]";
  return (
    <GlowFrame className="w-full">
      <button
        data-testid={`project-card-${project.id}`}
        onClick={() => onOpen({ mode: "video", project })}
        className="relative flex flex-col w-full text-left group/vcard cursor-pointer"
        aria-label={`Play ${project.title}`}
      >
        {/* Thumbnail: 16:9 for horizontal videos, 9:11 for vertical ones */}
        <div
          className={`relative overflow-hidden w-full ${box}`}
        >
          {/* Background: the same image, blurred, fills the empty space around the fitted thumbnail */}
          <img
            src={asset(project.thumbnail)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
          />
          {/* Thumbnail: fitted, never cropped */}
          <img
            src={asset(project.thumbnail)}
            alt={`${project.title} — thumbnail`}
            loading="lazy"
            className="relative w-full h-full object-contain transition-transform duration-700 ease-out group-hover/vcard:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/20"
          />
          <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.2em] text-white/85 bg-black/55 backdrop-blur px-2 py-1 rounded-md">
            {project.duration}
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vcard:opacity-100 transition-opacity duration-400">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-trio text-ink shadow-[0_0_40px_rgba(153,168,255,0.6)] scale-90 group-hover/vcard:scale-100 transition-transform duration-400">
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            </span>
          </span>
        </div>
        <div className="p-5">
          <p className="font-mono text-caption uppercase text-mist/70">{project.category}</p>
          <h3 className="mt-2 font-heading font-extrabold text-h3 text-slate-100">{project.title}</h3>
          <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-slate-500">
            {project.tags.filter(Boolean).join(" · ")}
          </p>
        </div>
      </button>
    </GlowFrame>
  );
};

const GradeCard = ({ project, onOpen }: { project: Project; onOpen: (t: LightboxTarget) => void }) => (
  <GlowFrame className="lg:col-span-3">
    <BeforeAfterSlider
      gradedSrc={asset(project.afterImage)}
      rawSrc={asset(project.beforeImage)}
      beforeLabel={project.beforeLabel!}
      afterLabel={project.afterLabel!}
      sliderColor={project.sliderColor}
      alt={`${project.title} — graded (left) vs raw (right)`}
      className="aspect-[16/10]"
      testId={`color-grade-slider-${project.id}`}
    />
    <div className="p-5 flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-caption uppercase text-mist/70">{project.category}</p>
        <h3 className="mt-2 font-heading font-extrabold text-h3 text-slate-100">{project.title}</h3>
        <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-slate-500">
          {project.tags.filter(Boolean).join(" · ")}
        </p>
      </div>
      <button
        data-testid={`project-card-${project.id}-expand`}
        onClick={() => onOpen({ mode: "grade", project })}
        aria-label={`Enlarge ${project.title} comparison`}
        className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-slate-300 transition-all duration-300 hover:border-transparent hover:text-ink hover:bg-trio hover:shadow-[0_0_24px_rgba(153,168,255,0.5)]"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  </GlowFrame>
);

export const SelectedWork = ({ onOpen }: SelectedWorkProps) => {
  const content = useContent();
  const device = useDevice();
  const shown = visibleVideos(content);
  const verticalVideos = shown.vertical.map((p) => resolveProject(p, device));
  const wideVideos = shown.horizontal.map((p) => resolveProject(p, device));
  const grades = visibleGrades(content).map((p) => resolveProject(p, device));
  const layout = content.layout;
  return (
    <section id="work" data-testid="selected-work-section" className="relative py-24 md:py-32">
      <div className="max-w-[1760px] mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-caption uppercase text-mist/80">
            01 — Selected Work
          </p>
          <h2
            data-testid="selected-work-tagline"
            className="mt-5 font-heading font-extrabold text-h1 text-slate-100 max-w-3xl"
          >
            {content.section.heading} <span className="text-gradient">{content.section.highlightedWord}</span>
          </h2>
          {content.section.subtext && (
            <p className="mt-4 max-w-2xl font-sans text-base text-slate-400">{content.section.subtext}</p>
          )}
        </Reveal>

        <div data-testid="selected-work-grid" className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          {verticalVideos.length > 0 && (
            <div className={`col-span-full grid grid-cols-2 gap-3 sm:gap-6 ${layout === "layout2" ? "lg:grid-cols-3" : ""}`}>
              {verticalVideos.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08} className="w-full">
                  <VideoCard project={p} onOpen={onOpen} layout={layout} />
                </Reveal>
              ))}
            </div>
          )}
          {wideVideos.map((p) => (
            <Reveal key={p.id} className="col-span-full w-full">
              <VideoCard project={p} onOpen={onOpen} layout={layout} />
            </Reveal>
          ))}
          {grades.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className="col-span-full lg:col-span-3">
              <GradeCard project={p} onOpen={onOpen} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SelectedWork;
