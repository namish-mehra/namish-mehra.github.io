import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { lenisRef, prefersReducedMotion } from "@/lib/scroll";
import { DIVIDER_WORDS } from "@/lib/site";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CustomCursor } from "@/components/CustomCursor";
import { BootLoader } from "@/components/BootLoader";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SelectedWork } from "@/components/SelectedWork";
import type { LightboxTarget } from "@/components/SelectedWork";
import { About } from "@/components/About";
import { Specialties } from "@/components/Specialties";
import { Contact } from "@/components/Contact";
import { Footer, DividerMarquee } from "@/components/Footer";
import { Marquee } from "@/components/Marquee";
import { LightboxModal } from "@/components/LightboxModal";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Portfolio crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink flex items-center justify-center p-8">
          <p className="font-mono text-caption uppercase text-slate-400">
            Something went wrong — please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxTarget | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lightbox && lenisRef.current) lenisRef.current.stop();
    else if (!lightbox && lenisRef.current) lenisRef.current.start();
  }, [lightbox]);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-ink text-slate-200">
        <BootLoader onDone={() => setBooted(true)} />
        <CustomCursor />
        <AnimatedBackground />

        <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        <Navbar />

        <main className="relative z-10">
          <Hero booted={booted} />
          <Marquee variant="divider" duration={42} testId="section-divider-marquee-hero" items={DIVIDER_WORDS} />
          <SelectedWork onOpen={setLightbox} />
          <About />
          <DividerMarquee />
          <Specialties />
          <Contact />
        </main>

        <div className="relative z-10">
          <Footer />
        </div>

        <AnimatePresence>
          {lightbox && <LightboxModal target={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
