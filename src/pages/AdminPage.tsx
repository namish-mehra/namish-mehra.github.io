import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, ExternalLink, Inbox, LayoutGrid, Loader2, LogOut, Save, Tags, Type, Undo2 } from "lucide-react";
import { getBundledContent } from "@/lib/content";
import type { SiteContent } from "@/lib/content";
import { CONTENT_ROW_ID, supabase } from "@/lib/supabase";
import { fetchLiveContent } from "@/lib/store";
import { WorkTab } from "./admin/WorkTab";
import { HistoryTab, InboxTab, TagsTab, TextsTab } from "./admin/OtherTabs";
import { btnGhost, btnPrimary, inputCls, labelCls } from "./admin/ui";

const ADMIN_EMAIL = "namish.mehra.01@gmail.com";

type Tab = "work" | "tags" | "texts" | "inbox" | "stats";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "work", label: "Work & layout", icon: LayoutGrid },
  { id: "tags", label: "Tags", icon: Tags },
  { id: "texts", label: "Texts & links", icon: Type },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "stats", label: "Visits & history", icon: BarChart3 },
];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-ink text-slate-200 font-body">{children}</div>
);

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

const Login = () => {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
  };

  return (
    <Shell>
      <div className="flex min-h-screen items-center justify-center p-5">
        <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/[0.07] bg-panel/80 p-7">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-8 w-auto" />
          <p className="mt-5 font-heading font-extrabold text-2xl text-slate-100">Admin</p>
          <p className="mt-1 text-sm text-slate-500">Log in to edit your portfolio.</p>
          <label className="mt-6 block">
            <span className={labelCls}>Email</span>
            <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>Password</span>
            <input
              className={inputCls}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </label>
          {err && <p className="mt-3 text-sm text-[#ffb4a8]">{err}</p>}
          <button type="submit" className={`${btnPrimary} mt-6 w-full`} disabled={busy || !password}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Log in
          </button>
          <a href={import.meta.env.BASE_URL} className="mt-4 block text-center font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500 hover:text-slate-300">
            ← Back to site
          </a>
        </form>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

const Editor = ({ session }: { session: Session }) => {
  const [tab, setTab] = useState<Tab>("work");
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [unread, setUnread] = useState(0);
  const [isFirstSave, setIsFirstSave] = useState(false);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from("site_content").select("updated_at").eq("id", CONTENT_ROW_ID).maybeSingle();
      const live = await fetchLiveContent();
      const start = live ?? getBundledContent();
      setIsFirstSave(!live);
      setSaved(start);
      setDraft(start);
      setSavedAt(data?.updated_at ?? null);
      const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false);
      setUnread(count ?? 0);
    })();
  }, []);

  const dirty = useMemo(() => !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useCallback((fn: (c: SiteContent) => SiteContent) => setDraft((d) => (d ? fn(d) : d)), []);

  const save = async () => {
    if (!supabase || !draft) return;
    setSaving(true);
    setMsg(null);
    // Stale-page guard: if the site was saved from another tab or device after this page loaded,
    // saving now would overwrite those newer changes with this older draft.
    const { data: current } = await supabase.from("site_content").select("updated_at").eq("id", CONTENT_ROW_ID).maybeSingle();
    if (current?.updated_at && savedAt && new Date(current.updated_at).getTime() !== new Date(savedAt).getTime()) {
      const go = window.confirm(
        "The site was saved from another tab or device after you opened this page.\n\nIf you save now, those newer changes are replaced by what you see here.\n\nPress OK to save anyway, or Cancel and reload this page first.",
      );
      if (!go) {
        setSaving(false);
        setMsg({ ok: false, text: "Not saved. Reload this page to see the newest version, then edit again." });
        return;
      }
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from("site_content").upsert({ id: CONTENT_ROW_ID, data: draft, updated_at: now });
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: `Not saved: ${error.message}` });
      return;
    }
    setSaved(draft);
    setSavedAt(now);
    setIsFirstSave(false);
    setMsg({ ok: true, text: "Saved. Your site is updated." });
  };

  const onUnread = useCallback((n: number) => setUnread(n), []);

  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <Shell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-5 text-center">
          <p className="text-slate-300">This account cannot edit the site.</p>
          <button type="button" className={btnGhost} onClick={() => void supabase?.auth.signOut()}>
            Log out
          </button>
        </div>
      </Shell>
    );
  }

  if (!draft) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-mist" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-6 w-auto" />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-300">Admin</span>
          <span className="hidden font-body text-[13px] text-slate-500 md:inline">
            {dirty ? "Unsaved changes" : savedAt ? `Last saved ${new Date(savedAt).toLocaleString()}` : "Not saved online yet"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a className={btnGhost} href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">View site</span>
            </a>
            <button
              type="button"
              className={btnGhost}
              disabled={!dirty}
              onClick={() => window.confirm("Throw away all unsaved changes?") && setDraft(saved)}
            >
              <Undo2 className="w-4 h-4" /> <span className="hidden sm:inline">Discard</span>
            </button>
            <button type="button" className={btnPrimary} disabled={(!dirty && !isFirstSave) || saving} onClick={() => void save()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button type="button" className={btnGhost} onClick={() => void supabase?.auth.signOut()} aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {msg && (
          <p className={`border-t border-white/[0.06] px-6 py-2 text-center text-sm ${msg.ok ? "text-mint" : "text-[#ffb4a8]"}`}>{msg.text}</p>
        )}
        {isFirstSave && !msg && (
          <p className="border-t border-white/[0.06] px-6 py-2 text-center text-sm text-amber-200">
            First time: press Save once to copy your current site into online storage.
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-[1760px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors ${
                tab === id ? "bg-trio text-ink" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "inbox" && unread > 0 && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${tab === id ? "bg-ink/20" : "bg-mist/20 text-mist"}`}>{unread}</span>
              )}
            </button>
          ))}
        </nav>
        <main className="min-w-0">
          {tab === "work" && <WorkTab content={draft} update={update} />}
          {tab === "tags" && <TagsTab content={draft} update={update} />}
          {tab === "texts" && <TextsTab content={draft} update={update} />}
          {tab === "inbox" && <InboxTab onUnread={onUnread} />}
          {tab === "stats" && (
            <HistoryTab
              onRestore={(c) => {
                setDraft(c);
                setTab("work");
                setMsg({ ok: true, text: "Old version loaded. Press Save to put it live." });
              }}
            />
          )}
        </main>
      </div>
    </Shell>
  );
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    document.title = "Admin — Namish Mehra";
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <Shell>
        <p className="p-10 text-center text-slate-400">Online storage is not connected (missing Supabase settings).</p>
      </Shell>
    );
  }
  if (session === undefined) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-mist" />
        </div>
      </Shell>
    );
  }
  return session ? <Editor session={session} /> : <Login />;
}
