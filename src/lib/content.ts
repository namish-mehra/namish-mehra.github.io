import publishedContent from "@/data/content.json";

export interface Label {
  text: string;
  bgColor: string;
  textColor: string;
}

export type Aspect = "9:16" | "16:9";
export type Device = "desktop" | "mobile";

/** Fields that can differ between PC and phone. Empty = use the shared ("Both") value. */
export const DEVICE_FIELDS = ["title", "category", "tags", "thumbnail", "beforeImage", "afterImage"] as const;
export type DeviceField = (typeof DEVICE_FIELDS)[number];
export type LayoutId = "layout1" | "layout2";

export interface Project {
  id: string;
  type: "video" | "beforeafter";
  category: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  thumbnail: string;
  youtubeUrl?: string;
  aspect?: Aspect;
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: Label;
  afterLabel?: Label;
  sliderColor?: string;
  /** Hidden cards stay saved but do not show on the site. */
  hidden?: boolean;
  /** Values used only on PC (screens 1024 px and wider). */
  desktop?: Partial<Pick<Project, DeviceField>>;
  /** Values used only on phones and tablets (narrower than 1024 px). */
  mobile?: Partial<Pick<Project, DeviceField>>;
}

/** The card as it shows on one device: shared values, then that device's own values on top. */
export const resolveProject = (p: Project, device: Device): Project => {
  const own = device === "mobile" ? p.mobile : p.desktop;
  if (!own) return p;
  const out: Project = { ...p };
  for (const f of DEVICE_FIELDS) {
    const v = own[f];
    if (v !== undefined && !(Array.isArray(v) && v.length === 0 && f !== "tags")) (out as unknown as Record<string, unknown>)[f] = v;
  }
  return out;
};

export interface SiteSettings {
  heroEyebrow: string;
  heroTagline: string;
  aboutHeading: string;
  aboutHighlight: string;
  aboutBio: string;
  aboutImage: string;
  location: string;
  tools: string[];
  craft: string[];
  statNumber: string;
  statLabel: string;
  statText: string;
  contactHeading: string;
  contactHeadingMiddle: string;
  contactHighlight: string;
  contactText: string;
  email: string;
  instagramUrl: string;
  /** Empty = no button. */
  youtubeUrl: string;
  xUrl: string;
  /** WhatsApp number with country code, digits only (e.g. 919876543210). Empty = no WhatsApp button. */
  whatsappNumber: string;
  footerRole: string;
  web3formsKey: string;
  seoTitle: string;
  seoDescription: string;
  shareImage: string;
}

export interface SiteContent {
  section: { heading: string; highlightedWord: string; subtext: string };
  layout: LayoutId;
  projects: Project[];
  tagLibrary: string[];
  settings: SiteSettings;
}

export const LAYOUTS: Record<LayoutId, { name: string; description: string; vertical: number; horizontal: number }> = {
  layout1: {
    name: "Layout 1",
    description: "2 vertical videos, 1 horizontal video, 2 color grades",
    vertical: 2,
    horizontal: 1,
  },
  layout2: {
    name: "Layout 2",
    description: "3 vertical videos in one row, 2 color grades",
    vertical: 3,
    horizontal: 0,
  },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** The copy of the content that ships inside the site (used before / without the database). */
export const getBundledContent = (): SiteContent => clone(publishedContent as SiteContent);

/** Fill any missing fields from the bundled copy, so older saves never break the site. */
export const normalizeContent = (raw: Partial<SiteContent> | null | undefined): SiteContent => {
  const base = getBundledContent();
  if (!raw || typeof raw !== "object") return base;
  return {
    section: { ...base.section, ...(raw.section ?? {}) },
    layout: raw.layout === "layout2" ? "layout2" : "layout1",
    projects: Array.isArray(raw.projects) ? raw.projects : base.projects,
    tagLibrary: Array.isArray(raw.tagLibrary) ? raw.tagLibrary : base.tagLibrary,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
  };
};

/** Which video cards show for the chosen layout, in order. */
export const visibleVideos = (content: SiteContent) => {
  const shown = content.projects.filter((p) => p.type === "video" && !p.hidden);
  const vertical = shown.filter((p) => p.aspect !== "16:9");
  const horizontal = shown.filter((p) => p.aspect === "16:9");
  const spec = LAYOUTS[content.layout];
  return { vertical: vertical.slice(0, spec.vertical), horizontal: horizontal.slice(0, spec.horizontal) };
};

export const visibleGrades = (content: SiteContent) =>
  content.projects.filter((p) => p.type === "beforeafter" && !p.hidden);

export const extractYoutubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:shorts\/|watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
};

export const getYoutubeEmbedUrl = (youtubeUrl: string) => {
  const id = extractYoutubeId(youtubeUrl) ?? youtubeUrl.split("/").pop();
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
};

/** Paths like "/images/x.jpg" also work when the site lives in a sub-folder (GitHub Pages project site). */
export const asset = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${url}`;
  return url;
};
