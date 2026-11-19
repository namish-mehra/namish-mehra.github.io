import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/** Null when the site is built without Supabase settings — the site then uses its built-in content. */
export const supabase = url && key ? createClient(url, key) : null;

export const CONTENT_ROW_ID = "main";
export const MEDIA_BUCKET = "media";
