import { createContext, useContext, useEffect, useState } from "react";
import type { Device } from "@/lib/content";
import type { ReactNode } from "react";
import { getBundledContent, normalizeContent } from "@/lib/content";
import type { SiteContent } from "@/lib/content";
import { CONTENT_ROW_ID, supabase } from "@/lib/supabase";

const CACHE_KEY = "nm-content-cache";

const ContentContext = createContext<SiteContent>(getBundledContent());

export const useContent = () => useContext(ContentContext);

const readCache = (): SiteContent | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeContent(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const writeCache = (c: SiteContent) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage may be blocked — the site still works */
  }
};

export const fetchLiveContent = async (): Promise<SiteContent | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_content").select("data").eq("id", CONTENT_ROW_ID).maybeSingle();
  if (error || !data) return null;
  return normalizeContent(data.data as Partial<SiteContent>);
};

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
};

/**
 * Adds one visit to today's count. When this browser has never opened the site before, it is also counted as a
 * "new user" (a flag in this browser's storage remembers it). No personal data is stored.
 */
const trackVisit = async () => {
  if (!supabase) return;
  let isNew = false;
  try {
    isNew = !localStorage.getItem("nm-visitor");
  } catch {
    isNew = false; // storage blocked: we cannot tell, so we do not count a new user
  }
  const res = await supabase.rpc("track_view", { is_new: isNew });
  if (res.error) {
    // The database update for new users is not installed yet: count a plain visit and try "new" again next time.
    await supabase.rpc("track_view");
    return;
  }
  try {
    if (isNew) localStorage.setItem("nm-visitor", "1");
  } catch {
    /* storage blocked */
  }
};

/** Public site: shows built-in (or cached) content at once, then swaps in the live content from the database. */
export const LiveContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<SiteContent>(() => readCache() ?? getBundledContent());

  useEffect(() => {
    let alive = true;
    fetchLiveContent().then((live) => {
      if (!alive || !live) return;
      setContent(live);
      writeCache(live);
    });
    // One visit per browser session; one "new user" the first time this browser opens the site.
    try {
      if (supabase && !sessionStorage.getItem("nm-viewed")) {
        sessionStorage.setItem("nm-viewed", "1");
        trackVisit().catch(() => undefined);
      }
    } catch {
      /* ignore */
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const s = content.settings;
    if (s.seoTitle) document.title = s.seoTitle;
    setMeta('meta[name="description"]', "content", s.seoDescription);
    setMeta('meta[property="og:title"]', "content", s.seoTitle);
    setMeta('meta[property="og:description"]', "content", s.seoDescription);
    setMeta('meta[name="twitter:title"]', "content", s.seoTitle);
    setMeta('meta[name="twitter:description"]', "content", s.seoDescription);
  }, [content]);

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
};

/** Admin live preview: shows the unsaved draft. */
export const StaticContentProvider = ({ value, children }: { value: SiteContent; children: ReactNode }) => (
  <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
);

/** Admin preview forces a device; on the real site it follows the screen width (phones/tablets < 1024 px). */
export const DeviceContext = createContext<Device | null>(null);

const MOBILE_QUERY = "(max-width: 1023px)";

export const useDevice = (): Device => {
  const forced = useContext(DeviceContext);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return forced ?? (mobile ? "mobile" : "desktop");
};
