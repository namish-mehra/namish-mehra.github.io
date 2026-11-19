import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * At build time, read the live title / description / share image from Supabase and write them into
 * index.html, so WhatsApp, Instagram and LinkedIn link previews show them (those apps do not run JavaScript).
 * If Supabase cannot be reached, the build keeps the values in index.html.
 */
const liveMeta = (env: Record<string, string>): Plugin => ({
  name: "live-meta",
  apply: "build",
  async transformIndexHtml(html) {
    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_KEY;
    if (!url || !key) return html;
    try {
      const res = await fetch(`${url}/rest/v1/site_content?id=eq.main&select=data`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const rows = (await res.json()) as { data?: { settings?: Record<string, string> } }[];
      const s = rows?.[0]?.data?.settings;
      if (!s) return html;
      let out = html;
      if (s.seoTitle) {
        out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(s.seoTitle)}</title>`);
        out = out.replace(/(property="og:title"\s+content=")[^"]*"/, `$1${esc(s.seoTitle)}"`);
        out = out.replace(/(name="twitter:title"\s+content=")[^"]*"/, `$1${esc(s.seoTitle)}"`);
      }
      if (s.seoDescription) {
        out = out.replace(/(name="description"\s+content=")[^"]*"/, `$1${esc(s.seoDescription)}"`);
        out = out.replace(/(property="og:description"\s+content=")[^"]*"/, `$1${esc(s.seoDescription)}"`);
        out = out.replace(/(name="twitter:description"\s+content=")[^"]*"/, `$1${esc(s.seoDescription)}"`);
      }
      if (s.shareImage) {
        const tags = `<meta property="og:image" content="${esc(s.shareImage)}" />\n<meta name="twitter:image" content="${esc(s.shareImage)}" />\n`;
        out = out.replace("</head>", `${tags}</head>`).replace('name="twitter:card" content="summary"', 'name="twitter:card" content="summary_large_image"');
      }
      return out;
    } catch {
      return html;
    }
  },
});

/** GitHub Pages has no server rewrites: copy a tiny 404.html that sends /admin (and any path) back to the app. */
const pagesFallback = (base: string): Plugin => ({
  name: "pages-404",
  apply: "build",
  closeBundle() {
    const b = base.replace(/\/$/, "");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting…</title><script>
var p = location.pathname.slice(${JSON.stringify(b)}.length) + location.search + location.hash;
location.replace(${JSON.stringify(b)} + "/?p=" + encodeURIComponent(p));
</script></head><body></body></html>`;
    fs.writeFileSync(path.resolve(__dirname, "dist/404.html"), html);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // "/" for a custom domain or <user>.github.io; "/repo-name/" for a GitHub project page.
  const base = env.VITE_BASE || "/";
  return {
    base,
    plugins: [react(), liveMeta(env), pagesFallback(base)],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: { port: 5173 },
  };
});
