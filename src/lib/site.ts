export const EMAIL = "namish.mehra.01@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/namish_mehra/";
export const BIO =
  "I'm Namish, a video editor focused on cutting content that holds attention — from concept to final grade. I care about pacing, rhythm, and making every second earn its place on screen.";
export const TAGLINE = "Your voice, my edit — built to keep people watching.";

export const PROJECT_TYPES = [
  "Talking-Head Edit",
  "Short Film",
  "Color Grade",
  "Social Content",
  "Other",
] as const;

export const NAV_LINKS = [
  { label: "Selected Work", hash: "#work", testId: "nav-link-selected-work" },
  { label: "About", hash: "#about", testId: "nav-link-about" },
  { label: "Specialties", hash: "#specialties", testId: "nav-link-specialties" },
  { label: "Contact", hash: "#contact", testId: "nav-link-contact" },
];

export const DIVIDER_WORDS = [
  "NARRATIVE",
  "STORYTELLING",
  "CINEMATOGRAPHY",
  "PROFESSIONAL",
  "COLOR THEORY",
  "MOTION DESIGNING",
  "SOUND DESIGNING",
];

const u = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const HERO_IMAGE = u("1490810194309-344b3661ba39", 1200);
export const ABOUT_IMAGE = u("1574717024653-61fd2cf4d44d", 1200);
