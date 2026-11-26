import { ArrowUp, Instagram, Youtube } from "lucide-react";
import { DIVIDER_WORDS } from "@/lib/site";
import { useContent } from "@/lib/store";
import { Marquee } from "@/components/Marquee";
import { scrollToSection } from "@/lib/scroll";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIAL_CLASS =
  "inline-flex items-center gap-3 font-mono text-[15px] tracking-[0.2em] uppercase text-slate-300 group/ig transition-colors duration-300 hover:text-mist";

export const Footer = () => {
  const { settings: s } = useContent();
  return (
  <footer data-testid="footer-section" className="relative border-t border-white/[0.05]">
    <Marquee
      variant="footer"
      duration={70}
      testId="footer-large-marquee"
      items={["NAMISH MEHRA — MOTION DESIGNER & VIDEO EDITOR"]}
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

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 self-start md:self-auto">
        {[
          { id: "instagram", label: "Instagram", href: s.instagramUrl, Icon: Instagram },
          { id: "youtube", label: "YouTube", href: s.youtubeUrl, Icon: Youtube },
          { id: "x", label: "X", href: s.xUrl, Icon: XIcon },
        ]
          .filter((l) => l.href)
          .map(({ id, label, href, Icon }) => (
            <a
              key={id}
              data-testid={`footer-${id}-link`}
              href={href}
              target="_blank"
              rel="me noopener noreferrer"
              className={SOCIAL_CLASS}
            >
              <Icon className="w-6 h-6" />
              <span className="group-hover/ig:text-gradient">{label}</span>
            </a>
          ))}

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
