import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Mail, RefreshCw, RotateCcw, Trash2, X } from "lucide-react";
import { normalizeContent } from "@/lib/content";
import type { SiteContent, SiteSettings } from "@/lib/content";
import { supabase } from "@/lib/supabase";
import { ImageField, TextInput, WordList, btnDanger, btnGhost, inputCls, panelCls } from "./ui";
import { LivePreview } from "./WorkTab";

type Update = (fn: (c: SiteContent) => SiteContent) => void;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */

export const TagsTab = ({ content, update }: { content: SiteContent; update: Update }) => {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const usage = (tag: string) => content.projects.filter((p) => p.tags.includes(tag)).length;

  const add = () => {
    const t = text.trim();
    if (!t || content.tagLibrary.some((x) => x.toLowerCase() === t.toLowerCase())) return setText("");
    update((c) => ({ ...c, tagLibrary: [...c.tagLibrary, t] }));
    setText("");
  };

  const rename = (from: string, to: string) => {
    const t = to.trim();
    if (!t || t === from) return setEditing(null);
    update((c) => ({
      ...c,
      tagLibrary: c.tagLibrary.map((x) => (x === from ? t : x)),
      projects: c.projects.map((p) => ({ ...p, tags: p.tags.map((x) => (x === from ? t : x)) })),
    }));
    setEditing(null);
  };

  const remove = (tag: string) => {
    const n = usage(tag);
    if (n && !window.confirm(`"${tag}" is used on ${n} card(s). Remove it from the list and from those cards?`)) return;
    update((c) => ({
      ...c,
      tagLibrary: c.tagLibrary.filter((x) => x !== tag),
      projects: c.projects.map((p) => ({ ...p, tags: p.tags.filter((x) => x !== tag) })),
    }));
  };

  return (
    <div className={panelCls}>
      <p className="font-heading font-extrabold text-lg text-slate-100">Tag list</p>
      <p className="mt-1 font-body text-[13px] text-slate-500">
        These tags show as choices on every card. Rename a tag here, and it changes on every card that uses it.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          className={inputCls}
          value={text}
          placeholder="New tag, for example Typography"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className={btnGhost} onClick={add}>
          Add
        </button>
      </div>
      <ul className="mt-5 divide-y divide-white/[0.06]">
        {content.tagLibrary.map((t) => (
          <li key={t} className="flex items-center gap-3 py-2.5">
            {editing === t ? (
              <>
                <input
                  autoFocus
                  className={inputCls}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") rename(t, editText);
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
                <button type="button" className="p-2 text-mint" onClick={() => rename(t, editText)} aria-label="Save name">
                  <Check className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-slate-400" onClick={() => setEditing(null)} aria-label="Cancel">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex-1 text-left font-body text-[15px] text-slate-100 hover:text-mist"
                  onClick={() => {
                    setEditing(t);
                    setEditText(t);
                  }}
                  title="Click to rename"
                >
                  {t}
                </button>
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-500">{usage(t)} cards</span>
                <button type="button" className="p-2 text-slate-500 hover:text-[#ffb4a8]" onClick={() => remove(t)} aria-label={`Delete ${t}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Texts & settings                                                    */
/* ------------------------------------------------------------------ */

export const TextsTab = ({ content, update }: { content: SiteContent; update: Update }) => {
  const [aboutDevice, setAboutDevice] = useState<"desktop" | "mobile">("desktop");
  const s = content.settings;
  const set = (patch: Partial<SiteSettings>) => update((c) => ({ ...c, settings: { ...c.settings, ...patch } }));
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className={panelCls}>
      <p className="font-heading font-extrabold text-lg text-slate-100">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
  return (
    <div className="space-y-6">
      {Group({
        title: "Hero (top of the page)",
        children: (
          <>
            <TextInput label="Small line above your name" value={s.heroEyebrow} onChange={(v) => set({ heroEyebrow: v })} />
            <TextInput label="Tagline" value={s.heroTagline} onChange={(v) => set({ heroTagline: v })} />
          </>
        ),
      })}
      {Group({
        title: "About",
        children: (
          <>
            <TextInput label="Heading" value={s.aboutHeading} onChange={(v) => set({ aboutHeading: v })} />
            <TextInput label="Gradient word" value={s.aboutHighlight} onChange={(v) => set({ aboutHighlight: v })} />
            <div className="sm:col-span-2">
              <TextInput label="About text" value={s.aboutBio} onChange={(v) => set({ aboutBio: v })} multiline />
            </div>
            <TextInput label="Location" value={s.location} onChange={(v) => set({ location: v })} hint="Also used in the footer." />
            <ImageField label="About photo (best 16:11)" value={s.aboutImage} onChange={(url) => set({ aboutImage: url })} folder="about" shape="horizontal" />
            <WordList label="Tools" value={s.tools} onChange={(v) => set({ tools: v })} />
            <WordList label="Craft" value={s.craft} onChange={(v) => set({ craft: v })} />
            <TextInput label="Big number" value={s.statNumber} onChange={(v) => set({ statNumber: v })} placeholder="30+" />
            <TextInput label="Number label" value={s.statLabel} onChange={(v) => set({ statLabel: v })} />
            <div className="sm:col-span-2">
              <TextInput label="Number text" value={s.statText} onChange={(v) => set({ statText: v })} />
            </div>
          </>
        ),
      })}
      <LivePreview content={content} section="about" device={aboutDevice} onDevice={setAboutDevice} />
      {Group({
        title: "Contact & links",
        children: (
          <>
            <TextInput label="Heading line 1" value={s.contactHeading} onChange={(v) => set({ contactHeading: v })} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Line 2" value={s.contactHeadingMiddle} onChange={(v) => set({ contactHeadingMiddle: v })} />
              <TextInput label="Gradient word" value={s.contactHighlight} onChange={(v) => set({ contactHighlight: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextInput label="Contact text" value={s.contactText} onChange={(v) => set({ contactText: v })} multiline />
            </div>
            <TextInput label="Email (copy button)" value={s.email} onChange={(v) => set({ email: v })} />
            <TextInput label="Instagram link" value={s.instagramUrl} onChange={(v) => set({ instagramUrl: v })} />
            <TextInput
              label="WhatsApp number"
              value={s.whatsappNumber}
              onChange={(v) => set({ whatsappNumber: v.replace(/\D/g, "") })}
              hint="Country code first, digits only. Example for India: 919876543210. Leave empty to hide the WhatsApp button."
            />
            <TextInput label="Footer role" value={s.footerRole} onChange={(v) => set({ footerRole: v })} />
            <TextInput
              label="Web3Forms access key"
              value={s.web3formsKey}
              onChange={(v) => set({ web3formsKey: v.trim() })}
              hint="Contact form emails go to the address that owns this key."
            />
          </>
        ),
      })}
      {Group({
        title: "Google & share preview",
        children: (
          <>
            <TextInput label="Page title" value={s.seoTitle} onChange={(v) => set({ seoTitle: v })} hint="Shown in the browser tab and in Google." />
            <ImageField
              label="Share image (1200 × 630)"
              value={s.shareImage}
              onChange={(url) => set({ shareImage: url })}
              folder="share"
              shape="any"
            />
            <div className="sm:col-span-2">
              <TextInput
                label="Description"
                value={s.seoDescription}
                onChange={(v) => set({ seoDescription: v })}
                multiline
                hint="WhatsApp, Instagram and LinkedIn read the title, description and share image from the page file, which is rebuilt every Monday. To update sooner: GitHub, Actions, 'Build and deploy to GitHub Pages', Run workflow. Old cards may stay in WhatsApp for a few days."
              />
            </div>
          </>
        ),
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Inbox                                                               */
/* ------------------------------------------------------------------ */

interface Message {
  id: number;
  name: string;
  email: string;
  project_type: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const InboxTab = ({ onUnread }: { onUnread: (n: number) => void }) => {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200);
    setLoading(false);
    if (error) return setErr(error.message);
    const list = (data ?? []) as Message[];
    setItems(list);
    onUnread(list.filter((m) => !m.is_read).length);
  }, [onUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (m: Message, read: boolean) => {
    if (!supabase) return;
    await supabase.from("messages").update({ is_read: read }).eq("id", m.id);
    void load();
  };
  const del = async (m: Message) => {
    if (!supabase || !window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return;
    await supabase.from("messages").delete().eq("id", m.id);
    void load();
  };

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <p className="font-heading font-extrabold text-lg text-slate-100">Inbox</p>
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <p className="mt-1 font-body text-[13px] text-slate-500">A copy of every contact form message. The same message also goes to your email.</p>
      {err && <p className="mt-3 font-body text-[13px] text-[#ffb4a8]">{err}</p>}
      {loading ? (
        <Loader2 className="mt-6 w-5 h-5 animate-spin text-mist" />
      ) : items.length === 0 ? (
        <p className="mt-6 font-body text-[14px] text-slate-500">No messages yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((m) => (
            <li key={m.id} className={`rounded-xl border p-4 ${m.is_read ? "border-white/[0.06]" : "border-mist/40 bg-mist/[0.04]"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body text-[15px] text-slate-100">
                  {!m.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-mist" />}
                  {m.name} <span className="text-slate-500">· {m.email}</span>
                </p>
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate-500">{fmtDate(m.created_at)}</p>
              </div>
              {m.project_type && <p className="mt-1 font-mono text-[10px] tracking-[0.18em] uppercase text-mist/80">{m.project_type}</p>}
              <p className="mt-2 whitespace-pre-wrap font-body text-[14px] text-slate-300">{m.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className={btnGhost} href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your project")}`}>
                  <Mail className="w-4 h-4" /> Reply
                </a>
                <button type="button" className={btnGhost} onClick={() => void markRead(m, !m.is_read)}>
                  {m.is_read ? "Mark unread" : "Mark read"}
                </button>
                <button type="button" className={btnDanger} onClick={() => void del(m)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Stats & history                                                     */
/* ------------------------------------------------------------------ */

export const HistoryTab = ({ onRestore }: { onRestore: (c: SiteContent) => void }) => {
  type Row = { day: string; views: number; new_users: number };
  const [views, setViews] = useState<Row[]>([]);
  const [newTotal, setNewTotal] = useState(0);
  const [newReady, setNewReady] = useState(true); // false until the "new users" database update is installed
  const [history, setHistory] = useState<{ id: number; saved_at: string; data: unknown }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
    (async () => {
      const [v, all, h] = await Promise.all([
        db.from("page_views").select("day, views, new_users").gte("day", since).order("day"),
        db.from("page_views").select("new_users"),
        db.from("content_history").select("id, saved_at, data").order("id", { ascending: false }).limit(30),
      ]);
      if (v.error || all.error) {
        // The "new_users" column does not exist yet: show visits only.
        const fb = await db.from("page_views").select("day, views").gte("day", since).order("day");
        setViews(((fb.data ?? []) as { day: string; views: number }[]).map((r) => ({ ...r, new_users: 0 })));
        setNewReady(false);
      } else {
        setViews((v.data ?? []) as Row[]);
        setNewTotal(((all.data ?? []) as { new_users: number }[]).reduce((a, r) => a + (r.new_users ?? 0), 0));
        setNewReady(true);
      }
      setHistory((h.data ?? []) as { id: number; saved_at: string; data: unknown }[]);
      setLoading(false);
    })();
  }, []);

  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const byDay = new Map(views.map((v) => [v.day, v]));
  const visitsOn = (d: string) => byDay.get(d)?.views ?? 0;
  const newOn = (d: string) => byDay.get(d)?.new_users ?? 0;
  const max = Math.max(1, ...days.map(visitsOn));
  const total = days.reduce((a, d) => a + visitsOn(d), 0);
  const today = visitsOn(days[29]);
  const newMonth = days.reduce((a, d) => a + newOn(d), 0);
  const stat = (n: number | string, label: string, tone: "grad" | "plain") => (
    <div>
      <p className={`font-heading font-extrabold text-[28px] leading-8 ${tone === "grad" ? "text-gradient" : "text-slate-100"}`}>{n}</p>
      <p className="font-mono text-[10px] leading-[14px] tracking-[0.16em] uppercase text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-panel/80 p-4 md:p-5">
        <p className="font-heading font-extrabold text-base leading-6 text-slate-100">Visits and new users (last 30 days)</p>
        <p className="font-body text-[12px] leading-4 text-slate-500">
          A visit is one browser session. A new user is a browser that opens your site for the first time. No personal data is stored.
        </p>
        <div className="mt-2.5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {stat(total, "Visits · 30 days", "grad")}
            {stat(today, "Visits · today", "plain")}
            {stat(newReady ? newMonth : "–", "New users · 30 days", "grad")}
            {stat(newReady ? newTotal : "–", "Total new users", "plain")}
          </div>
          <div className="flex h-14 items-stretch gap-[3px] md:h-auto" role="img" aria-label={`Visits per day, ${total} in total`}>
            {days.map((d) => {
              const n = visitsOn(d);
              const nu = newOn(d);
              return (
                <div key={d} className="flex min-w-0 flex-1 flex-col justify-end" title={`${d}: ${n} visits, ${nu} new users`}>
                  <div
                    className={`w-full rounded-t-[3px] ${d === days[29] ? "bg-mist" : "bg-mist/70"}`}
                    style={{ height: `${Math.max(n ? 8 : 3, (n / max) * 100)}%`, opacity: n ? 1 : 0.25 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {!newReady && (
          <p className="mt-2 font-body text-[12px] text-slate-500">New users are not counted yet. Ask Claude to run the database update.</p>
        )}
      </div>

      <div className={panelCls}>
        <p className="font-heading font-extrabold text-lg text-slate-100">Save history</p>
        <p className="mt-1 font-body text-[13px] text-slate-500">
          Your last 30 saves. Restore loads a version into the editor. Press Save to put it live.
        </p>
        {loading ? (
          <Loader2 className="mt-6 w-5 h-5 animate-spin text-mist" />
        ) : history.length === 0 ? (
          <p className="mt-4 font-body text-[14px] text-slate-500">No saves yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {history.map((h, i) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-body text-[14px] text-slate-200">
                  {fmtDate(h.saved_at)} {i === 0 && <span className="ml-2 font-mono text-[10px] tracking-[0.18em] text-mint">LIVE NOW</span>}
                </span>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    if (window.confirm("Load this version into the editor? Your unsaved changes will be replaced.")) {
                      onRestore(normalizeContent(h.data as Partial<SiteContent>));
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" /> Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
