/** Rebuilt from the compiled CSS of the original site. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0e12",
        ink2: "#0e141a",
        panel: "#11171d",
        ocean: "#003049",
        mist: "#99dbff",
        iris: "#99a8ff",
        mint: "#99fff0",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        hero: ["clamp(3.25rem, 8.4vw, 122px)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        h1: ["clamp(2.5rem, 5.2vw, 76px)", { lineHeight: "1.06", letterSpacing: "-0.015em" }],
        h3: ["clamp(1.25rem, 1.8vw, 29px)", { lineHeight: "1.25" }],
        body: ["18px", { lineHeight: "1.7" }],
        caption: ["11px", { lineHeight: "1.5", letterSpacing: "0.22em" }],
      },
      keyframes: {
        "drift-a": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(7%, -5%, 0) scale(1.09)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1)" },
        },
        "drift-b": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1.04)" },
          "50%": { transform: "translate3d(-6%, 6%, 0) scale(0.96)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1.04)" },
        },
        "drift-c": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, 7%, 0) scale(1.12)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1)" },
        },
        marquee: { to: { transform: "translate3d(-50%, 0, 0)" } },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        "scroll-cue": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
      },
      animation: {
        "drift-a": "drift-a 13s ease-in-out infinite",
        "drift-b": "drift-b 9s ease-in-out infinite",
        "drift-c": "drift-c 7s ease-in-out infinite",
        marquee: "marquee 50s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "scroll-cue": "scroll-cue 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite",
      },
    },
  },
  plugins: [],
};
