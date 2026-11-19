import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, GripVertical, Layers, Loader2, Monitor, Plus, RotateCcw, Smartphone, Trash2, Wand2 } from "lucide-react";
import { LAYOUTS, extractYoutubeId } from "@/lib/content";
import type { Device, DeviceField, LayoutId, Project, SiteContent } from "@/lib/content";
import { fetchYoutubeInfo, imageSizeFromUrl, normalizeDuration, shapeWarning } from "@/lib/media";
import { ImageField, TagPicker, TextInput, Warning, btnDanger, btnGhost, inputCls, labelCls, panelCls } from "./ui";

type Update = (fn: (c: SiteContent) => SiteContent) => void;

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}`;

const patchProject = (update: Update, id: string, patch: Partial<Project>) =>
  update((c) => ({ ...c, projects: c.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

/** Lets a card editor switch the live preview to PC or Mobile. */
const PreviewDeviceCtx = createContext<(d: Device) => void>(() => undefined);

type Target = "both" | Device;

/** Read/write a field for the chosen target: Both = shared value, PC / Mobile = that device's own value. */
const useDeviceFields = (p: Project, update: Update) => {
  const [target, setTargetState] = useState<Target>("both");
  const showDevice = useContext(PreviewDeviceCtx);
  const setTarget = (t: Target) => {
    setTargetState(t);
    if (t !== "both") showDevice(t);
  };
  const val = <K extends DeviceField>(f: K): Project[K] => {
    if (target === "both") return p[f];
    const own = p[target]?.[f];
    return (own !== undefined ? own : p[f]) as Project[K];
  };
  const setD = (patch: Partial<Pick<Project, DeviceField>>) => {
    if (target === "both") return patchProject(update, p.id, patch);
    patchProject(update, p.id, { [target]: { ...(p[target] ?? {}), ...patch } } as Partial<Project>);
  };
  const reset = (d: Device) => patchProject(update, p.id, { [d]: undefined } as Partial<Project>);
  return { target, setTarget, val, setD, reset };
};

const DeviceTargetBar = ({ p, target, setTarget, reset }: { p: Project; target: Target; setTarget: (t: Target) => void; reset: (d: Device) => void }) => {
  const has = (d: Device) => !!p[d] && Object.values(p[d] ?? {}).some((v) => v !== undefined);
  const opts: [Target, typeof Layers, string][] = [
    ["both", Layers, "Both"],
    ["desktop", Monitor, "PC"],
    ["mobile", Smartphone, "Mobile"],
  ];
  return (
    <div className="mb-5 rounded-xl border border-white/[0.08] bg-ink/60 p-3">
      <span className={labelCls}>Edit for</span>
      <div className="flex flex-wrap gap-2">
        {opts.map(([t, Icon, name]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] tracking-[0.16em] uppercase ${
              target === t ? "border-mist bg-mist/10 text-mist" : "border-white/10 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" /> {name}
            {t !== "both" && has(t) && <span className="h-1.5 w-1.5 rounded-full bg-mint" title="Has its own values" />}
          </button>
        ))}
      </div>
      <p className="mt-2 font-body text-[12px] text-slate-500">
        {target === "both"
          ? "Changes here show on PC and on phones (unless PC or Mobile has its own value)."
          : `Thumbnail, title, category, tags${p.type === "beforeafter" ? " and images" : ""} you change now show only on ${
              target === "desktop" ? "PC (1024 px and wider)" : "phones and tablets"
            }. Other fields stay shared.`}
      </p>
      {target !== "both" && has(target) && (
        <button type="button" onClick={() => reset(target)} className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-slate-400 hover:text-white">
          <RotateCcw className="w-3.5 h-3.5" /> Use the shared values on {target === "desktop" ? "PC" : "Mobile"} again
        </button>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Layout picker + status                                              */
/* ------------------------------------------------------------------ */

const LayoutSketch = ({ id }: { id: LayoutId }) => {
  const box = "rounded-[3px] bg-mist/40";
  return (
    <div className="flex h-24 w-full flex-col gap-1.5 rounded-lg bg-ink2 p-2">
      {id === "layout1" ? (
        <>
          <div className="grid flex-[3] grid-cols-2 gap-1.5">
            <div className={box} />
            <div className={box} />
          </div>
          <div className={`flex-[2] ${box}`} />
        </>
      ) : (
        <div className="grid flex-[5] grid-cols-3 gap-1.5">
          <div className={box} />
          <div className={box} />
          <div className={box} />
        </div>
      )}
      <div className="grid flex-[2] grid-cols-2 gap-1.5">
        <div className="rounded-[3px] bg-iris/30" />
        <div className="rounded-[3px] bg-iris/30" />
      </div>
    </div>
  );
};

const LayoutStatus = ({ content }: { content: SiteContent }) => {
  const spec = LAYOUTS[content.layout];
  const shown = content.projects.filter((p) => p.type === "video" && !p.hidden);
  const v = shown.filter((p) => p.aspect !== "16:9").length;
  const h = shown.filter((p) => p.aspect === "16:9").length;
  const notes: string[] = [];
  if (v < spec.vertical) notes.push(`${spec.name} needs ${spec.vertical} vertical videos. You have ${v} shown. Add or show ${spec.vertical - v} more.`);
  if (v > spec.vertical) notes.push(`Only the first ${spec.vertical} vertical videos show in ${spec.name}. ${v - spec.vertical} more are hidden from the site.`);
  if (h < spec.horizontal) notes.push(`${spec.name} needs 1 horizontal (16:9) video. You have none shown.`);
  if (h > spec.horizontal)
    notes.push(
      spec.horizontal === 0
        ? `${spec.name} has no horizontal slot, so your horizontal video does not show. It stays saved for Layout 1.`
        : `Only the first horizontal video shows. ${h - spec.horizontal} more are hidden from the site.`,
    );
  return notes.length ? (
    <div className="mt-3 space-y-2">
      {notes.map((n) => (
        <Warning key={n} text={n} />
      ))}
    </div>
  ) : (
    <p className="mt-3 font-body text-[13px] text-mint">This layout is complete.</p>
  );
};

/* ------------------------------------------------------------------ */
/* Card editors                                                        */
/* ------------------------------------------------------------------ */

const VideoEditor = ({ p, content, update }: { p: Project; content: SiteContent; update: Update }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [thumbWarn, setThumbWarn] = useState("");
  const set = (patch: Partial<Project>) => patchProject(update, p.id, patch);
  const vertical = p.aspect !== "16:9";
  const { target, setTarget, val, setD, reset } = useDeviceFields(p, update);
  const thumb = val("thumbnail");

  useEffect(() => {
    let alive = true;
    if (!thumb) return;
    imageSizeFromUrl(thumb).then((s) => {
      if (alive && s) setThumbWarn(shapeWarning(s.width, s.height, vertical ? "vertical" : "horizontal"));
    });
    return () => {
      alive = false;
    };
  }, [thumb, vertical]);

  const fetchInfo = async (useThumb: boolean) => {
    if (!p.youtubeUrl) return;
    setBusy(true);
    setMsg("");
    const info = await fetchYoutubeInfo(p.youtubeUrl);
    setBusy(false);
    if (!info) {
      setMsg("This does not look like a YouTube link.");
      return;
    }
    if (info.isShort) set({ aspect: "9:16" });
    const patch: Partial<Pick<Project, DeviceField>> = {};
    if (info.title) patch.title = info.title;
    if (useThumb) patch.thumbnail = info.thumbnail;
    setD(patch);
    setMsg(
      `${info.title ? "Title filled in." : "Could not read the title — type it."}${useThumb ? " YouTube thumbnail added." : ""} Type the length yourself (YouTube does not share it without an API key).`,
    );
  };

  return (
    <>
    <DeviceTargetBar p={p} target={target} setTarget={setTarget} reset={reset} />
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <span className={labelCls}>YouTube link</span>
          <input
            className={inputCls}
            value={p.youtubeUrl ?? ""}
            placeholder="Paste or drop a YouTube link"
            onChange={(e) => set({ youtubeUrl: e.target.value.trim() })}
            onDrop={(e) => {
              const t = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
              if (t) {
                e.preventDefault();
                set({ youtubeUrl: t.trim() });
              }
            }}
          />
          {p.youtubeUrl && !extractYoutubeId(p.youtubeUrl) && <Warning text="This link is not a YouTube video link." />}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={busy || !p.youtubeUrl} onClick={() => void fetchInfo(false)}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Get title
            </button>
            <button type="button" className={btnGhost} disabled={busy || !p.youtubeUrl} onClick={() => void fetchInfo(true)}>
              Title + YouTube thumbnail
            </button>
          </div>
          {msg && <p className="mt-2 font-body text-[13px] text-slate-400">{msg}</p>}
        </div>
        <TextInput label="Title" value={val("title")} onChange={(v) => setD({ title: v })} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Category (small line)" value={val("category")} onChange={(v) => setD({ category: v })} placeholder="Talking Head" />
          <label className="block">
            <span className={labelCls}>Length</span>
            <input
              className={inputCls}
              value={p.duration}
              placeholder="01:05"
              onChange={(e) => set({ duration: e.target.value })}
              onBlur={(e) => set({ duration: normalizeDuration(e.target.value) })}
            />
          </label>
        </div>
        <div>
          <span className={labelCls}>Video shape</span>
          <div className="flex gap-2">
            {(["9:16", "16:9"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => set({ aspect: a })}
                className={`flex-1 rounded-lg border px-3 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase ${
                  (p.aspect ?? "9:16") === a ? "border-mist bg-mist/10 text-mist" : "border-white/10 text-slate-400"
                }`}
              >
                {a === "9:16" ? "Vertical" : "Horizontal 16:9"}
              </button>
            ))}
          </div>
        </div>
        <TagPicker
          value={val("tags")}
          onChange={(tags) => setD({ tags })}
          library={content.tagLibrary}
          onAddToLibrary={(t) => update((c) => ({ ...c, tagLibrary: [...c.tagLibrary, t] }))}
        />
      </div>
      <div>
        <ImageField
          label={vertical ? "Thumbnail (best 9:11 or 9:16)" : "Thumbnail (best 16:9)"}
          value={thumb}
          onChange={(url) => setD({ thumbnail: url })}
          folder="thumbnails"
          shape={vertical ? "vertical" : "horizontal"}
          previewClass={vertical ? "aspect-[9/11] max-w-[280px]" : "aspect-video"}
        />
        <Warning text={thumbWarn} />
      </div>
    </div>
    </>
  );
};

const GradeEditor = ({ p, content, update }: { p: Project; content: SiteContent; update: Update }) => {
  const set = (patch: Partial<Project>) => patchProject(update, p.id, patch);
  const { target, setTarget, val, setD, reset } = useDeviceFields(p, update);
  const before = p.beforeLabel ?? { text: "Raw footage", bgColor: "#000000", textColor: "#b3b3b3" };
  const after = p.afterLabel ?? { text: "Color graded", bgColor: "#000000", textColor: "#e6e6e6" };
  return (
    <div className="space-y-4">
      <DeviceTargetBar p={p} target={target} setTarget={setTarget} reset={reset} />
      <div className="grid gap-4 md:grid-cols-2">
        <ImageField label="Raw image (before)" value={val("beforeImage") ?? ""} onChange={(url) => setD({ beforeImage: url })} folder="grades" shape="horizontal" />
        <ImageField
          label="Color-graded image (after)"
          value={val("afterImage") ?? ""}
          onChange={(url) => setD({ afterImage: url, thumbnail: url })}
          folder="grades"
          shape="horizontal"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Title" value={val("title")} onChange={(v) => setD({ title: v })} />
        <TextInput label="Category (small line)" value={val("category")} onChange={(v) => setD({ category: v })} />
        <TextInput label="Label on raw side" value={before.text} onChange={(v) => set({ beforeLabel: { ...before, text: v } })} />
        <TextInput label="Label on graded side" value={after.text} onChange={(v) => set({ afterLabel: { ...after, text: v } })} />
      </div>
      <TagPicker
        value={val("tags")}
        onChange={(tags) => setD({ tags })}
        library={content.tagLibrary}
        onAddToLibrary={(t) => update((c) => ({ ...c, tagLibrary: [...c.tagLibrary, t] }))}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Card list with drag-to-reorder                                      */
/* ------------------------------------------------------------------ */

const CardList = ({
  title,
  kind,
  content,
  update,
  addLabel,
  onAdd,
}: {
  title: string;
  kind: Project["type"];
  content: SiteContent;
  update: Update;
  addLabel: string;
  onAdd: () => void;
}) => {
  const items = content.projects.filter((p) => p.type === kind);
  const [open, setOpen] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const move = (from: string, to: string) => {
    if (from === to) return;
    update((c) => {
      const list = [...c.projects];
      const fi = list.findIndex((p) => p.id === from);
      const [item] = list.splice(fi, 1);
      const ti = list.findIndex((p) => p.id === to);
      list.splice(ti, 0, item);
      return { ...c, projects: list };
    });
  };

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading font-extrabold text-lg text-slate-100">{title}</p>
        <button type="button" className={btnGhost} onClick={onAdd}>
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      </div>
      <p className="mt-1 font-body text-[13px] text-slate-500">Drag a card by its handle to change the order. The eye shows or hides a card.</p>
      <div className="mt-4 space-y-2.5">
        {items.map((p) => {
          const isOpen = open === p.id;
          return (
            <div
              key={p.id}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverId(p.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) move(dragId, p.id);
                setDragId(null);
                setOverId(null);
              }}
              className={`rounded-xl border bg-ink2/70 transition-colors ${
                overId === p.id && dragId !== p.id ? "border-mist" : "border-white/[0.08]"
              } ${p.hidden ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2 p-2.5">
                <span
                  draggable
                  onDragStart={(e) => {
                    setDragId(p.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className="cursor-grab p-1 text-slate-500 hover:text-slate-200 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-panel">
                  {p.thumbnail && <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />}
                </span>
                <button type="button" onClick={() => setOpen(isOpen ? null : p.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-body text-[15px] text-slate-100">{p.title || "Untitled"}</span>
                  <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-slate-500">
                    {kind === "video" ? (p.aspect === "16:9" ? "Horizontal" : "Vertical") : "Color grade"}
                    {p.hidden ? " · hidden" : ""}
                  </span>
                </button>
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-white"
                  onClick={() => patchProject(update, p.id, { hidden: !p.hidden })}
                  title={p.hidden ? "Show on site" : "Hide from site"}
                  aria-label={p.hidden ? "Show on site" : "Hide from site"}
                >
                  {p.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button" className="p-2 text-slate-400 hover:text-white" onClick={() => setOpen(isOpen ? null : p.id)} aria-label="Edit">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-white/[0.06] p-4">
                  {kind === "video" ? <VideoEditor p={p} content={content} update={update} /> : <GradeEditor p={p} content={content} update={update} />}
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => {
                        if (window.confirm(`Delete "${p.title || "this card"}"? You can still undo it with Discard or History.`)) {
                          update((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== p.id) }));
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete card
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="font-body text-[14px] text-slate-500">No cards yet.</p>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Live preview                                                        */
/* ------------------------------------------------------------------ */

export const LivePreview = ({
  content,
  section = "work",
  device,
  onDevice,
}: {
  content: SiteContent;
  section?: "work" | "about";
  device: "desktop" | "mobile";
  onDevice: (d: "desktop" | "mobile") => void;
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.4);
  const [docH, setDocH] = useState(900);
  const [ready, setReady] = useState(false);
  const width = device === "desktop" ? 1440 : 390;

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const measure = () => setScale(Math.min(1, outer.clientWidth / width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "nm-preview-ready") setReady(true);
      if (e.data?.type === "nm-preview-height") setDocH(Math.max(200, e.data.height));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage({ type: "nm-preview", content, device, section }, window.location.origin);
  }, [ready, content, device, section]);

  return (
    <div className={`${panelCls} min-w-0`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading font-extrabold text-lg text-slate-100">Live preview</p>
        <div className="flex gap-1.5">
          {(
            [
              ["desktop", Monitor, "PC"],
              ["mobile", Smartphone, "Mobile"],
            ] as const
          ).map(([d, Icon, name]) => (
            <button
              key={d}
              type="button"
              onClick={() => onDevice(d)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] ${device === d ? "border-mist text-mist" : "border-white/10 text-slate-500"}`}
            >
              <Icon className="w-4 h-4" /> {name}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 font-body text-[13px] text-slate-500">Shows your unsaved changes. Visitors see them only after you press Save.</p>
      <div ref={outerRef} className="relative mt-4 w-full min-w-0 overflow-hidden rounded-xl border border-white/[0.06] bg-ink" style={{ height: docH * scale }}>
        <iframe
          ref={frameRef}
          title="Live preview"
          src={`${import.meta.env.BASE_URL}admin-preview`}
          scrolling="no"
          style={{
            width,
            height: docH,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: device === "mobile" ? `calc(50% - ${(width * scale) / 2}px)` : 0,
          }}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Work tab                                                            */
/* ------------------------------------------------------------------ */

export const WorkTab = ({ content, update }: { content: SiteContent; update: Update }) => {
  const [device, setDevice] = useState<Device>("desktop");
  const addVideo = () =>
    update((c) => ({
      ...c,
      projects: [
        ...c.projects,
        {
          id: newId("v"),
          type: "video",
          category: "Talking Head",
          title: "New video",
          description: "",
          tags: [],
          duration: "",
          thumbnail: "/images/placeholder-video.svg",
          youtubeUrl: "",
          aspect: "9:16",
          hidden: false,
        },
      ],
    }));
  const addGrade = () =>
    update((c) => ({
      ...c,
      projects: [
        ...c.projects,
        {
          id: newId("g"),
          type: "beforeafter",
          category: "Color Grade",
          title: "New grade",
          description: "",
          tags: ["DaVinci Resolve", "Color Grading"],
          duration: "",
          thumbnail: "/images/placeholder-after.svg",
          beforeImage: "/images/placeholder-before.svg",
          afterImage: "/images/placeholder-after.svg",
          beforeLabel: { text: "Raw footage", bgColor: "#000000", textColor: "#b3b3b3" },
          afterLabel: { text: "Color graded", bgColor: "#000000", textColor: "#e6e6e6" },
          sliderColor: "#ffffff",
          hidden: false,
        },
      ],
    }));

  return (
    <PreviewDeviceCtx.Provider value={setDevice}>
    <div className="space-y-6">
      <div className={panelCls}>
        <p className="font-heading font-extrabold text-lg text-slate-100">Layout</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => update((c) => ({ ...c, layout: id }))}
              className={`rounded-xl border p-3 text-left transition-colors ${
                content.layout === id ? "border-mist bg-mist/[0.07]" : "border-white/10 hover:border-white/25"
              }`}
            >
              <LayoutSketch id={id} />
              <span className="mt-3 block font-heading font-extrabold text-slate-100">
                {LAYOUTS[id].name} {content.layout === id && <span className="ml-1 font-mono text-[10px] tracking-[0.2em] text-mist">IN USE</span>}
              </span>
              <span className="block font-body text-[13px] text-slate-400">{LAYOUTS[id].description}</span>
            </button>
          ))}
        </div>
        <LayoutStatus content={content} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <div className={panelCls}>
            <p className="font-heading font-extrabold text-lg text-slate-100">Section heading</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextInput label="Heading" value={content.section.heading} onChange={(v) => update((c) => ({ ...c, section: { ...c.section, heading: v } }))} />
              <TextInput
                label="Gradient word"
                value={content.section.highlightedWord}
                onChange={(v) => update((c) => ({ ...c, section: { ...c.section, highlightedWord: v } }))}
              />
            </div>
          </div>
          <CardList title="Video cards" kind="video" content={content} update={update} addLabel="Video" onAdd={addVideo} />
          <CardList title="Color-grade cards" kind="beforeafter" content={content} update={update} addLabel="Grade" onAdd={addGrade} />
        </div>
        <div className="min-w-0 2xl:sticky 2xl:top-24 self-start">
          <LivePreview content={content} device={device} onDevice={setDevice} />
        </div>
      </div>
    </div>
    </PreviewDeviceCtx.Provider>
  );
};
