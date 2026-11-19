import { ArrowUp, Instagram } from "lucide-react";
import { DIVIDER_WORDS } from "@/lib/site";
import { useContent } from "@/lib/store";
import { Marquee } from "@/components/Marquee";
import { scrollToSection } from "@/lib/scroll";

export const Footer = () => {
  const { settings: s } = useContent();
  return (
  <footer data-testid="footer-section" className="relative border-t border-white/[0.05]">
    <Marquee
      variant="footer"
      duration={70}
      testId="footer-large-marquee"
      items={["NAMISH MEHRA — FILM & MOTION EDITOR"]}
    />

    <div className="max-w-[1760px] mx-auto px-5 sm:px-8 py-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div>
        <p className="font-heading font-extrabold text-h3 text-slate-100">
          Namish Mehra<span className="text-gradient">.</span>
        </p>
        <p className="mt-2 font-mono text-caption uppercase text-slate-500">
          {s.footerRole} — {s.location}
        </p>
      </div>

      <div className="flex items-center gap-6 self-start md:self-auto">
        <a
          data-testid="footer-instagram-link"
          href={s.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 font-mono text-[15px] tracking-[0.2em] uppercase text-slate-300 group/ig transition-colors duration-300 hover:text-mist"
        >
          <Instagram className="w-6 h-6" />
          <span className="group-hover/ig:text-gradient">Instagram</span>
        </a>

        <button
          data-testid="footer-back-to-top"
          onClick={() => scrollToSection("#home")}
          aria-label="Back to top"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-slate-300 transition-all duration-300 hover:border-transparent hover:bg-trio hover:text-ink"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="border-t border-white/[0.05]">
      <p className="max-w-[1760px] mx-auto px-5 sm:px-8 py-6 font-mono text-[10px] tracking-[0.25em] uppercase text-slate-600">
        © {new Date().getFullYear()} Namish Mehra — All rights reserved
      </p>
    </div>
  </footer>
  );
};

export const DividerMarquee = () => (
  <Marquee
    variant="divider"
    duration={42}
    testId="section-divider-marquee"
    items={DIVIDER_WORDS}
  />
);

export default Footer;
