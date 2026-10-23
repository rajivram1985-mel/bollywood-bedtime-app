import { FILMS, COLLECTIONS } from "./films";
import EN_TEXTS from "./stories/en.json";
import EN_HI_TEXTS from "./stories/en-hi.json";
import HI_TEXTS from "./stories/hi.json";
import { STORY_AUDIO } from "./storyAudio";
import { AGE_KEYS } from "../constants/ageRanges";
import { DEFAULT_LANGUAGE } from "../constants/languages";

export { COLLECTIONS };

const STORY_TEXTS = { en: EN_TEXTS, "en-hi": EN_HI_TEXTS, hi: HI_TEXTS };

// Narrated English runs ~145 words per minute. Hindi uses more, shorter words
// (postpositions are separate words), so it gets through more per minute.
const WORDS_PER_MINUTE = { en: 145, "en-hi": 145, hi: 165 };

export function estimateMinutes(text, language = DEFAULT_LANGUAGE) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / (WORDS_PER_MINUTE[language] ?? 145)));
}

// Pick the version written for this age; if it doesn't exist yet, fall back
// to the nearest age (preferring younger — simpler is safer at bedtime).
function pickAge(available, wanted) {
  if (available.includes(wanted)) return wanted;
  const wi = AGE_KEYS.indexOf(wanted);
  return [...available].sort((a, b) => {
    const da = Math.abs(AGE_KEYS.indexOf(a) - wi);
    const db = Math.abs(AGE_KEYS.indexOf(b) - wi);
    return da - db || AGE_KEYS.indexOf(a) - AGE_KEYS.indexOf(b);
  })[0];
}

// A film's story in the child's language at (or nearest to) their age. If the
// film has nothing in that language yet, fall back to English rather than
// hiding the film — the card and player say which language is playing.
export function getFilmStory(film, ageRange, language = DEFAULT_LANGUAGE) {
  let lang = language;
  let texts = STORY_TEXTS[lang]?.[film.id];
  if (!texts || !Object.keys(texts).length) {
    lang = DEFAULT_LANGUAGE;
    texts = STORY_TEXTS[lang]?.[film.id];
  }
  const available = Object.keys(texts || {});
  if (!available.length) return null;
  const age = pickAge(available, ageRange);
  const text = texts[age];
  const audio = STORY_AUDIO[lang]?.[film.id]?.[age] ?? null;
  return {
    // English ids keep their original shape so existing play history still matches.
    id: lang === "en" ? `${film.id}:${age}` : `${film.id}:${age}:${lang}`,
    filmId: film.id,
    title: film.title,
    year: film.year,
    tagline: film.tagline,
    collection: film.collection,
    ageRange: age,
    language: lang,
    text,
    audio,
    narrated: !!audio,
    illustration: film.illustration,
    posterUrl: null,
    minutes: estimateMinutes(text, lang),
    kind: "bundled",
  };
}

export function getBundledStories(ageRange, language = DEFAULT_LANGUAGE) {
  return FILMS.map((f) => getFilmStory(f, ageRange, language)).filter(Boolean);
}

export function toGeneratedStory(saved) {
  const language = saved.language || DEFAULT_LANGUAGE;
  return {
    id: `gen:${saved.movieName}:${saved.ageRange || ""}:${language}`,
    filmId: null,
    title: saved.movieName,
    year: null,
    tagline: "A story you made",
    collection: "mine",
    ageRange: saved.ageRange || null,
    language,
    text: saved.text,
    audio: null,
    narrated: false,
    illustration: null,
    posterUrl: saved.posterUrl || null,
    minutes: estimateMinutes(saved.text, language),
    kind: "generated",
    movieName: saved.movieName,
  };
}

// Tonight's pick rotates daily and skips anything this child heard recently,
// so the hero isn't the same film every night.
export function pickTonight(stories, { seed = "", recentIds = [] } = {}) {
  if (!stories.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  let hash = day;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const fresh = stories.filter((s) => !recentIds.includes(s.id));
  const pool = fresh.length ? fresh : stories;
  return pool[hash % pool.length];
}

// Queue for the player: the chosen story first, then the rest in catalogue
// order, so "2 stories tonight" flows into a sensible next one.
export function buildQueue(stories, startId) {
  const i = stories.findIndex((s) => s.id === startId);
  if (i < 0) return stories;
  return [...stories.slice(i), ...stories.slice(0, i)];
}
