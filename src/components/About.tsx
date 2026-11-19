import { MapPin } from "lucide-react";
import { useContent } from "@/lib/store";
import { asset } from "@/lib/content";
import { Reveal } from "@/components/Reveal";

export const About = () => {
  const { settings: s } = useContent();
  return (
  <section id="about" data-testid="about-section" className="relative py-24 md:py-32">
    <div className="max-w-[1760px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
      <div className="lg:col-span-7">
        <Reveal>
          <p className="font-mono text-caption uppercase text-mist/80">02 — About</p>
          <h2 className="mt-5 font-heading font-extrabold text-h1 text-slate-100">
            {s.aboutHeading} <span className="text-gradient">{s.aboutHighlight}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p
            data-testid="about-bio-text"
            className="mt-8 font-body text-body text-slate-300 max-w-xl"
          >
            {s.aboutBio}
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <div
            data-testid="about-location-tag"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
          >
            <MapPin className="w-4 h-4 text-mist" />
            <span className="font-mono text-caption uppercase text-slate-300">
              {s.location}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12">
            <p className="font-mono text-caption uppercase text-slate-500">Tools</p>
            <div data-testid="about-tools-pills" className="mt-4 flex flex-wrap gap-3">
              {s.tools.map((t) => (
                <span
                  key={t}
                  className="rounded-xl border border-transparent bg-trio/10 px-4 py-2 font-body text-[15px] text-slate-100 transition-all duration-300 hover:opacity-100 hover:shadow-[0_0_20px_rgba(153,168,255,0.35)] hover:border-trio/40"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-8">
            <p className="font-mono text-caption uppercase text-slate-500">Craft</p>
            <div data-testid="about-skills-pills" className="mt-4 flex flex-wrap gap-3">
              {s.craft.map((c) => (
                <span
                  key={c}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-body text-[15px] text-slate-400 transition-all duration-300 hover:text-slate-100 hover:border-trio/30"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-8">
        <Reveal delay={0.1}>
          <div className="relative rounded-2xl p-[1.5px] bg-trio/50">
            <div className="relative rounded-[15px] overflow-hidden bg-panel">
              <img
                src={asset(s.aboutImage)}
                alt="About Namish Mehra"
                loading="lazy"
                className="w-full aspect-[16/11] object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,14,18,0.75), transparent 50%), radial-gradient(circle at 50% 35%, rgba(153,219,255,0.1), transparent 55%)",
                }}
              />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.18}>
          <div
            data-testid="about-stat-projects"
            className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-panel/80 p-8 md:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-ocean/50 blur-[70px]"
            />
            <p className="font-heading font-extrabold text-[clamp(4rem,6vw,6.5rem)] leading-none">
              <span className="text-gradient">{s.statNumber}</span>
            </p>
            <p className="mt-3 font-mono text-caption uppercase text-slate-300">
              {s.statLabel}
            </p>
            <p className="mt-4 font-body text-[15px] text-slate-400">
              {s.statText}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
  );
};

export default About;
