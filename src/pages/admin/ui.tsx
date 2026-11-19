import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { shapeWarning, uploadImage } from "@/lib/media";
import type { ShapeHint } from "@/lib/media";

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-ink2 px-3 py-2.5 font-body text-[15px] text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-mist/60";
export const labelCls = "block font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500 mb-1.5";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-trio px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-ink transition-shadow hover:shadow-[0_0_24px_rgba(153,168,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-slate-300 transition-colors hover:border-mist/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#ffb4a8]/30 px-3 py-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#ffb4a8] hover:bg-[#ffb4a8]/10";
export const panelCls = "rounded-2xl border border-white/[0.07] bg-panel/80 p-5 md:p-6";

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className={labelCls}>{label}</span>
    {children}
    {hint && <span className="mt-1 block font-body text-[12px] text-slate-500">{hint}</span>}
  </label>
);

export const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}) => (
  <Field label={label} hint={hint}>
    {multiline ? (
      <textarea rows={4} className={`${inputCls} resize-y`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    )}
  </Field>
);

export const Warning = ({ text }: { text: string }) =>
  text ? (
    <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-300/[0.06] px-3 py-2 font-body text-[13px] text-amber-200">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      {text}
    </p>
  ) : null;

/** Click or drop an image. It is compressed, checked for shape, and uploaded to online storage. */
export const ImageField = ({
  label,
  value,
  onChange,
  folder,
  shape = "any",
  previewClass = "aspect-video",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  shape?: ShapeHint;
  previewClass?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState("");
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    setBusy(true);
    setErr("");
    setWarn("");
    try {
      const { url, width, height } = await uploadImage(file, folder);
      onChange(url);
      setWarn(shapeWarning(width, height, shape));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        className={`group relative block w-full overflow-hidden rounded-xl border border-dashed ${
          over ? "border-mist bg-mist/10" : "border-white/15 bg-ink2"
        } ${previewClass}`}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <ImagePlus className="w-6 h-6" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Click or drop image</span>
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? "Uploading…" : "Click or drop to replace"}
        </span>
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-6 h-6 animate-spin text-mist" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <details className="mt-1.5">
        <summary className="cursor-pointer font-mono text-[10px] tracking-[0.18em] uppercase text-slate-600 hover:text-slate-400">
          Or paste an image link
        </summary>
        <input className={`${inputCls} mt-1.5 text-[13px]`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
      </details>
      {err && <p className="mt-2 font-body text-[13px] text-[#ffb4a8]">{err}</p>}
      <Warning text={warn} />
    </div>
  );
};

/** Pick tags from the list or type a new one (Enter). New tags are added to the shared list. */
export const TagPicker = ({
  value,
  onChange,
  library,
  onAddToLibrary,
  label = "Tags",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  library: string[];
  onAddToLibrary: (tag: string) => void;
  label?: string;
}) => {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const existing = library.find((t) => t.toLowerCase() === tag.toLowerCase());
    const final = existing ?? tag;
    if (!existing) onAddToLibrary(final);
    if (!value.some((t) => t.toLowerCase() === final.toLowerCase())) onChange([...value, final]);
    setText("");
  };
  const suggestions = library.filter((t) => !value.includes(t));
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-mist/15 px-3 py-1 font-body text-[13px] text-mist">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="font-body text-[13px] text-slate-600">No tags yet.</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className={inputCls}
          value={text}
          placeholder="Type a tag and press Enter"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            }
          }}
        />
        <button type="button" className={btnGhost} onClick={() => add(text)} aria-label="Add tag">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="rounded-full border border-white/10 px-2.5 py-1 font-body text-[12px] text-slate-400 hover:border-mist/40 hover:text-slate-100"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** A simple list editor for short words (tools, craft). */
export const WordList = ({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) => {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-body text-[13px] text-slate-200">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className={inputCls}
          value={text}
          placeholder="Add and press Enter"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className={btnGhost} onClick={add} aria-label="Add">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
