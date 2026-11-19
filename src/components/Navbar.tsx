import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/site";
import { scrollToSection } from "@/lib/scroll";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (hash: string) => {
    setOpen(false);
    scrollToSection(hash);
  };

  return (
    <header
      data-testid="navbar-header"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-ink/85 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1760px] mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
        <button
          data-testid="navbar-logo-link"
          onClick={() => go("#home")}
          className="flex items-center gap-3 group"
        >
          <LogoMark className="w-8 h-8" />
          <span className="font-mono text-[12px] tracking-[0.3em] uppercase text-slate-200 group-hover:text-white transition-colors">
            Namish&nbsp;Mehra
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <button
              key={l.hash}
              data-testid={l.testId}
              onClick={() => go(l.hash)}
              className="font-mono text-caption uppercase text-slate-400 hover:text-gradient transition-all duration-300 hover:tracking-[0.3em]"
            >
              {l.label}
            </button>
          ))}
          <button
            data-testid="nav-cta-contact"
            onClick={() => go("#contact")}
            className="relative rounded-full px-5 py-2 font-mono text-caption uppercase text-ink bg-trio hover:shadow-[0_0_24px_rgba(153,168,255,0.5)] transition-shadow duration-300"
          >
            Start a project
          </button>
        </nav>

        <button
          data-testid="navbar-mobile-toggle"
          className="md:hidden p-2 text-slate-200"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            data-testid="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-ink/95 backdrop-blur-xl border-b border-white/[0.06]"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.hash}
                  data-testid={l.testId}
                  onClick={() => go(l.hash)}
                  className="text-left font-heading font-extrabold text-h3 text-slate-200 hover:text-gradient"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/logo-mark.png" alt="" className={className} aria-hidden="true" />
);

export default Navbar;
