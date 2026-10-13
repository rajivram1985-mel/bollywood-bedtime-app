export const AGE_RANGES = [
  {
    key: "3-5",
    label: "3–5 years",
    short: "3–5",
    emoji: "🧸",
    description: "Simple words, short and soothing",
  },
  {
    key: "6-8",
    label: "6–8 years",
    short: "6–8",
    emoji: "🌟",
    description: "Playful, a little longer",
  },
  {
    key: "9-12",
    label: "9–12 years",
    short: "9–12",
    emoji: "📚",
    description: "Richer stories, more detail",
  },
];

export const AGE_KEYS = AGE_RANGES.map((a) => a.key);
export const DEFAULT_AGE = "6-8";

export function ageLabel(key) {
  return AGE_RANGES.find((a) => a.key === key)?.short ?? key;
}
