import { AudioWaveform, Mic, Palette, Shapes } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const SPECIALTIES = [
  {
    id: "talking-head",
    icon: Mic,
    title: "Talking-Head Editing",
    body: "My primary craft — pace-led cuts for podcasts, interviews and YouTube, built around hooks, rhythm and retention.",
  },
  {
    id: "sound-design",
    icon: AudioWaveform,
    title: "Sound Design",
    body: "Layered ambience, punchy SFX and clean mixes that make a cut feel finished, not just assembled.",
  },
  {
    id: "color-grading",
    icon: Palette,
    title: "Color Grading",
    body: "From flat log to a deliberate look — contrast, tone and palette shaped scene by scene in DaVinci Resolve.",
  },
  {
    id: "motion-graphics",
    icon: Shapes,
    title: "Motion Graphics",
    body: "Titles, callouts and transitions in After Effects that carry the story without stealing focus.",
  },
];

export const Specialties = () => (
  <section id="specialties" data-testid="specialties-section" className="relative py-24 md:py-32">
    <div className="max-w-[1760px] mx-auto px-5 sm:px-8">
      <Reveal>
        <p className="font-mono text-caption uppercase text-mist/80">03 — Specialties</p>
        <h2 className="mt-5 font-heading font-extrabold text-h1 text-slate-100">
          Where I add <span className="text-gradient">value</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {SPECIALTIES.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.id} delay={i * 0.07}>
              <article
                data-testid={`specialty-card-${s.id}`}
                className="relative group h-full rounded-2xl border border-white/[0.07] bg-panel/70 p-7 transition-all duration-500 hover:border-transparent hover:bg-white/[0.02] overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="absolute -inset-px rounded-2xl bg-trio opacity-0 blur-[10px] transition-opacity duration-500 group-hover:opacity-40 pointer-events-none"
                />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-trio/25 bg-trio/10 text-mist transition-all duration-500 group-hover:bg-trio group-hover:text-ink group-hover:shadow-[0_0_24px_rgba(153,168,255,0.5)]">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.2em] text-slate-600">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 font-heading font-extrabold text-h3 text-slate-100">
                    {s.title}
                  </h3>
                  <p className="mt-3.5 font-body text-[15px] leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

export default Specialties;
