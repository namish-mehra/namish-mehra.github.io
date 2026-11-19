import { useEffect, useRef, useState } from "react";
import type { Device, SiteContent } from "@/lib/content";
import { DeviceContext, StaticContentProvider } from "@/lib/store";
import { StillContext } from "@/components/Reveal";
import { SelectedWork } from "@/components/SelectedWork";
import { About } from "@/components/About";

/**
 * Shown only inside the admin's live-preview frame. The admin sends the unsaved draft with postMessage,
 * so the preview uses the real screen-width rules (phone layout in the phone frame).
 */
export default function PreviewPage() {
  const [data, setData] = useState<{ content: SiteContent; device: Device; section: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "nm-preview") return;
      setData({ content: e.data.content, device: e.data.device, section: e.data.section });
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "nm-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const send = () => window.parent.postMessage({ type: "nm-preview-height", height: el.scrollHeight }, window.location.origin);
    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  return (
    <div ref={rootRef} className="bg-ink text-slate-200" style={{ pointerEvents: "none" }}>
      {data && (
        <StillContext.Provider value={true}>
          <DeviceContext.Provider value={data.device}>
            <StaticContentProvider value={data.content}>
              {data.section === "about" ? <About /> : <SelectedWork onOpen={() => undefined} />}
            </StaticContentProvider>
          </DeviceContext.Provider>
        </StillContext.Provider>
      )}
    </div>
  );
}
