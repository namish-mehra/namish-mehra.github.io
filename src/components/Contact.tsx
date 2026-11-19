import { useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, Instagram, Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/site";
import { useContent } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Reveal } from "@/components/Reveal";

type Status = "idle" | "loading" | "success" | "error";

interface Errors {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-ink2/80 px-4 py-3.5 font-body text-[16px] text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-300 focus:border-trio/60 focus:shadow-[0_0_0_3px_rgba(153,168,255,0.12)]";

export const Contact = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ name: "", email: "", projectType: "", message: "", companyWebsite: "" });

  const { settings } = useContent();
  const EMAIL = settings.email;
  const [copied, setCopied] = useState(false);

  // WhatsApp: visitor opens a chat with the owner (needs the number from the admin). Instagram: opens the DM thread.
  const waNumber = (settings.whatsappNumber ?? "").replace(/\D/g, "");
  const whatsappUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi Namish, I found your portfolio and I'd like to talk about our new project")}` : "";
  const igUser = (settings.instagramUrl ?? "").split("?")[0].split("/").filter(Boolean).pop() ?? "";
  const instagramDm = /^[A-Za-z0-9._]+$/.test(igUser) && !/instagram\.com$/i.test(igUser) ? `https://ig.me/m/${igUser}` : "";
  const copyTimer = useRef<number>();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // Fallback for browsers that block the clipboard API.
      const t = document.createElement("textarea");
      t.value = EMAIL;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key === "projectType" ? "projectType" : key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!form.projectType) next.projectType = "Please choose a project type.";
    if (form.message.trim().length < 10) next.message = "Tell me a little more — at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (!validate()) return;
    setStatus("loading");
    try {
          if (form.companyWebsite) {
        setStatus("success");
        return;
      }
      // Two copies: the admin inbox (Supabase, no monthly limit) and the email (Web3Forms, monthly limit).
      // The visitor sees "sent" when at least one of them worked, so a full email quota loses nothing.
      const saveToInbox = async (): Promise<boolean> => {
        if (!supabase) return false;
        const { error } = await supabase.from("messages").insert({
          name: form.name.trim(),
          email: form.email.trim(),
          project_type: form.projectType,
          message: form.message.trim(),
        });
        return !error;
      };
      const sendEmail = async (): Promise<boolean> => {
        try {
          const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: settings.web3formsKey,
              subject: `New portfolio enquiry — ${form.name.trim()}`,
              from_name: "Portfolio contact form",
              name: form.name.trim(),
              email: form.email.trim(),
              replyto: form.email.trim(),
              project_type: form.projectType,
              message: form.message.trim(),
            }),
          });
          const data = await res.json();
          return res.ok && !!data.success;
        } catch {
          return false;
        }
      };
      const [inboxOk, emailOk] = await Promise.all([saveToInbox(), sendEmail()]);
      if (!inboxOk && !emailOk) throw new Error("send failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setForm({ name: "", email: "", projectType: "", message: "", companyWebsite: "" });
    setErrors({});
    setStatus("idle");
  };

  return (
    <section id="contact" data-testid="contact-section" className="relative py-24 md:py-32">
      <div className="max-w-[1760px] mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-start">
        <Reveal>
          <p className="font-mono text-caption uppercase text-mist/80">04 — Contact</p>
          <h2 className="mt-5 font-heading font-extrabold text-h1 text-slate-100 leading-[1.05]">
            {settings.contactHeading}
            <br />
            {settings.contactHeadingMiddle} <span className="text-gradient">{settings.contactHighlight}</span>
          </h2>
          <p className="mt-7 font-body text-body text-slate-400 max-w-md">
            {settings.contactText}
          </p>
          <button
            type="button"
            data-testid="contact-mailto-link"
            onClick={copyEmail}
            aria-label={`Copy email address ${EMAIL}`}
            className="group mt-9 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left cursor-pointer transition-all duration-300 hover:border-trio/50 hover:shadow-[0_0_28px_rgba(153,168,255,0.3)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-trio/10 text-mist transition-all duration-300 group-hover:bg-trio group-hover:text-ink">
              {copied ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </span>
            <span>
              <span
                className={`block font-mono text-[10px] tracking-[0.25em] uppercase transition-colors duration-300 ${
                  copied ? "text-mint" : "text-slate-500"
                }`}
                aria-live="polite"
              >
                {copied ? "Copied to clipboard" : "Prefer email? Click to copy"}
              </span>
              <span className="block font-body text-[15px] text-slate-100">{EMAIL}</span>
            </span>
          </button>

          <div className="mt-4 flex flex-col items-start gap-4">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-whatsapp-link"
                className="order-2 w-[244px] max-w-full group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:border-trio/50 hover:shadow-[0_0_28px_rgba(153,168,255,0.3)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-trio/10 text-mist transition-all duration-300 group-hover:bg-trio group-hover:text-ink">
                  <MessageCircle className="w-4 h-4" />
                </span>
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.25em] uppercase text-slate-500">Quick reply</span>
                  <span className="block font-body text-[15px] text-slate-100">Chat on WhatsApp</span>
                </span>
              </a>
            )}
            {instagramDm && (
              <a
                href={instagramDm}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-instagram-dm-link"
                className="order-1 w-[284px] max-w-full group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:border-trio/50 hover:shadow-[0_0_28px_rgba(153,168,255,0.3)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-trio/10 text-mist transition-all duration-300 group-hover:bg-trio group-hover:text-ink">
                  <Instagram className="w-4 h-4" />
                </span>
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.25em] uppercase text-slate-500">Send a DM</span>
                  <span className="block font-body text-[15px] text-slate-100">Message on Instagram</span>
                </span>
              </a>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          {status === "success" ? (
            <div
              data-testid="contact-form-success-message"
              className="relative h-full min-h-[420px] rounded-2xl border border-white/[0.07] bg-panel/70 p-10 flex flex-col items-center justify-center text-center"
            >
              <div
                aria-hidden="true"
                className="absolute -top-14 right-0 h-44 w-44 rounded-full bg-mint/10 blur-[60px]"
              />
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-trio text-ink shadow-[0_0_40px_rgba(153,168,255,0.5)]">
                <Send className="w-6 h-6" />
              </span>
              <h3 className="mt-7 font-heading font-extrabold text-h3 text-slate-100">
                Message sent.
              </h3>
              <p className="mt-3 font-body text-[15px] text-slate-400 max-w-xs">
                Thanks for reaching out — I&apos;ll get back to you soon.
              </p>
              <button
                onClick={reset}
                className="mt-8 rounded-full border border-white/15 px-6 py-3 font-mono text-caption uppercase text-slate-200 transition-all duration-300 hover:border-transparent hover:bg-trio hover:text-ink"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              data-testid="contact-form"
              onSubmit={onSubmit}
              noValidate
              className="relative rounded-2xl border border-white/[0.07] bg-panel/70 p-7 md:p-9"
            >
              <div
                aria-hidden="true"
                className="absolute -top-16 left-1/4 h-40 w-40 rounded-full bg-iris/10 blur-[60px] pointer-events-none"
              />

              <div className="relative grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="cf-name" className="font-mono text-caption uppercase text-slate-400">
                    Name
                  </label>
                  <input
                    id="cf-name"
                    data-testid="contact-input-name"
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    className={`mt-2.5 ${fieldClass}`}
                  />
                  {errors.name && <FieldError text={errors.name} testId="contact-error-name" />}
                </div>
                <div>
                  <label htmlFor="cf-email" className="font-mono text-caption uppercase text-slate-400">
                    Email
                  </label>
                  <input
                    id="cf-email"
                    data-testid="contact-input-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    className={`mt-2.5 ${fieldClass}`}
                  />
                  {errors.email && <FieldError text={errors.email} testId="contact-error-email" />}
                </div>
              </div>

              <div className="relative mt-5">
                <label htmlFor="cf-type" className="font-mono text-caption uppercase text-slate-400">
                  Project type
                </label>
                <div className="relative mt-2.5">
                  <select
                    id="cf-type"
                    data-testid="contact-select-project-type"
                    value={form.projectType}
                    onChange={set("projectType")}
                    className={`appearance-none pr-11 ${fieldClass} ${form.projectType ? "" : "text-slate-600"}`}
                  >
                    <option value="" disabled>
                      Choose a project type
                    </option>
                    {PROJECT_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-ink text-slate-100">
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
                {errors.projectType && (
                  <FieldError text={errors.projectType} testId="contact-error-project-type" />
                )}
              </div>

              <div className="relative mt-5">
                <label htmlFor="cf-message" className="font-mono text-caption uppercase text-slate-400">
                  Message
                </label>
                <textarea
                  id="cf-message"
                  data-testid="contact-input-message"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="What are we editing?"
                  rows={5}
                  className={`mt-2.5 resize-none ${fieldClass}`}
                />
                {errors.message && <FieldError text={errors.message} testId="contact-error-message" />}
              </div>

              <input
                type="text"
                name="company_website"
                value={form.companyWebsite}
                onChange={set("companyWebsite")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] top-0 h-0 w-0 opacity-0"
              />

              {status === "error" && (
                <div
                  data-testid="contact-form-error-message"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#ffb4a8]/25 bg-[#ffb4a8]/[0.06] px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 text-[#ffb4a8] shrink-0" />
                  <p className="font-body text-[14px] text-[#ffb4a8]">
                    Something went wrong sending your message — please try again, or email me
                    directly at {EMAIL}.
                  </p>
                </div>
              )}

              <button
                data-testid="contact-form-submit-button"
                type="submit"
                disabled={status === "loading"}
                className="mt-7 w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-trio px-6 py-4 font-mono text-[12px] tracking-[0.22em] uppercase text-ink transition-all duration-300 hover:shadow-[0_0_36px_rgba(153,168,255,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send email
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
};

const FieldError = ({ text, testId }: { text: string; testId: string }) => (
  <p data-testid={testId} className="mt-2 font-mono text-[11px] tracking-[0.08em] text-[#ffb4a8]">
    {text}
  </p>
);

export default Contact;
