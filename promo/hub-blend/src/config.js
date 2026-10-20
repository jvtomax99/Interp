// Blend: v11 story + laptop reel staging + phone hero motion + HUMC. 31.0 s at 120 BPM (beat = 0.5 s).
// OPEN = the HUMC opening bar; every time in T is measured after it.
export const OPEN = 2.0;
export const DURATION = 31.0;
export const FPS = 30;

// Act / beat boundaries (seconds). Everything keys off these.
export const T = {
  hookEnd: 8.0,
  spinEnd: 9.6,
  logoEnd: 10.6,
  revealEnd: 12.0,
  features: [12.0, 14.0, 16.0, 18.0, 20.0],
  featEnd: 22.0,
  morphEnd: 23.0,
  dim: 25.0,
};

export const C = {
  navy0: "#03061a",
  navy1: "#0b1640",
  navy2: "#1a3a96",
  cyan: "#3fc6ee",
  cyanDeep: "#0b1a4a",
  red: "#f0436a",
  white: "#ffffff",
  paper: "#eef2f7",
};

export const COPY = {
  hook: {
    doctorLabel: "THE DOCTOR",
    doctor: ["Heart", "failure"],
    timerLabel: "TO FIND THE WORD",
    interpLabel: "THE INTERPRETER",
    wrong: ["¿Fallo", "cardíaco?"],
    wrongPill: "Not for patients.",
    rightLabel: "THE RIGHT WORD",
    right: ["Insuficiencia", "cardíaca"],
    rightPill: "There it is.",
  },
  built: ["Built by our", "own interpreters."],
  features: [
    { a: "One glossary.", b: "Every specialty.", screen: "glossary" },
    { a: "Glossary first.", b: "AI second.", screen: "translate" },
    { a: "101 false friends.", b: "Flagged.", screen: "falsefriends" },
    { a: "National certification.", b: "Prep built in.", screen: "cert" },
    { a: "Stuck?", b: "Ask Dr. Smiley.", screen: "ask" },
  ],
  hudLeft: "INTERPRETER HUB — HUMC",
  laptopTitle: "Interpreter Hub",
  laptopSub: "for the HUMC interpreter team",
  endTag: "Built here, for our patients.",
  url: "interp-six.vercel.app",
  live: "Live today, on any phone.",
  closer: ["Better words.", "Safer care."],
};
