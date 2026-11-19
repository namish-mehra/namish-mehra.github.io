import { extractYoutubeId } from "@/lib/content";
import { MEDIA_BUCKET, supabase } from "@/lib/supabase";

export type ShapeHint = "vertical" | "horizontal" | "any";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });

/** Resize to at most `maxSide` px on the long side and save as WebP (much smaller files). */
export const compressImage = async (file: File, maxSide = 1920, quality = 0.86) => {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot process images.");
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob) throw new Error("Could not compress this image.");
    return { blob, width: w, height: h, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** A friendly warning when an image does not match the card shape. Empty string = OK. */
export const shapeWarning = (width: number, height: number, hint: ShapeHint): string => {
  if (hint === "any" || !width || !height) return "";
  const r = width / height;
  if (hint === "vertical" && r > 0.95) {
    return `This image is ${width} × ${height} (wide). A vertical card looks best with a tall image, for example 1080 × 1320 (9:11) or 1080 × 1920 (9:16).`;
  }
  if (hint === "horizontal" && Math.abs(r - 16 / 9) > 0.12) {
    return `This image is ${width} × ${height}. A horizontal card looks best at 16:9, for example 1920 × 1080.`;
  }
  if (Math.max(width, height) < 1000) {
    return `This image is small (${width} × ${height}). It can look soft on big screens. Use at least 1080 px on the long side.`;
  }
  return "";
};

export const uploadImage = async (file: File, folder: string) => {
  if (!supabase) throw new Error("Online storage is not connected.");
  const { blob, width, height } = await compressImage(file);
  const safe = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/gi, "-").toLowerCase().slice(0, 40) || "image";
  const path = `${folder}/${Date.now()}-${safe}.webp`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, width, height };
};

export const imageSizeFromUrl = async (url: string) => {
  try {
    const img = await loadImage(url);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
};

export interface YoutubeInfo {
  id: string;
  title: string;
  isShort: boolean;
  thumbnail: string;
}

/** Title comes from YouTube's public oEmbed (via noembed.com, which allows browser requests). */
export const fetchYoutubeInfo = async (url: string): Promise<YoutubeInfo | null> => {
  const id = extractYoutubeId(url);
  if (!id) return null;
  const isShort = /\/shorts\//.test(url);
  let title = "";
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
    const data = (await res.json()) as { title?: string; error?: string };
    title = (data.title ?? "").replace(/#\S+/g, "").replace(/\s{2,}/g, " ").trim();
  } catch {
    /* title stays empty; the user can type it */
  }
  // maxresdefault is not made for every video; hqdefault always exists.
  const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const size = await imageSizeFromUrl(maxres);
  const thumbnail = size && size.width > 120 ? maxres : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return { id, title, isShort, thumbnail };
};

/** Accepts "1:05", "01:05", "65" and returns "01:05". */
export const normalizeDuration = (v: string) => {
  const t = v.trim();
  if (!t) return "";
  const parts = t.split(":").map((x) => parseInt(x, 10));
  if (parts.some((n) => Number.isNaN(n))) return t;
  let secs = parts.length === 1 ? parts[0] : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
