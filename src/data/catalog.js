import { FILMS, COLLECTIONS } from "./films";
import STORY_TEXTS from "./storyTexts.json";
import { STORY_AUDIO } from "./storyAudio";
import { AGE_KEYS } from "../constants/ageRanges";

export { COLLECTIONS };

// Narrated audio runs ~145 words per minute; device TTS at our rate is similar.
const WORDS_PER_MINUTE = 145;

export function estimateMinutes(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
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

export function getFilmStory(film, ageRange) {
  const texts = STORY_TEXTS[film.id] || {};
  const available = Object.keys(texts);
  if (!available.length) return null;
  const age = pickAge(available, ageRange);
  const text = texts[age];
  const audio = STORY_AUDIO[film.id]?.[age] ?? null;
  return {
    id: `${film.id}:${age}`,
    filmId: film.id,
    title: film.title,
    year: film.year,
    tagline: film.tagline,
    collection: film.collection,
    ageRange: age,
    text,
    audio,
    narrated: !!audio,
    illustration: film.illustration,
    posterUrl: null,
    minutes: estimateMinutes(text),
    kind: "bundled",
  };
}

export function getBundledStories(ageRange) {
  return FILMS.map((f) => getFilmStory(f, ageRange)).filter(Boolean);
}

export function toGeneratedStory(saved) {
  return {
    id: `gen:${saved.movieName}:${saved.ageRange || ""}`,
    filmId: null,
    title: saved.movieName,
    year: null,
    tagline: "A story you made",
    collection: "mine",
    ageRange: saved.ageRange || null,
    text: saved.text,
    audio: null,
    narrated: false,
    illustration: null,
    posterUrl: saved.posterUrl || null,
    minutes: estimateMinutes(saved.text),
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
