import { Platform } from "react-native";
import * as Speech from "expo-speech";

// On-device narration for stories without recorded audio.
//
// Stories are split into short sentence groups and spoken one at a time:
//  - Android's TTS rejects input longer than Speech.maxSpeechInputLength (4000
//    chars) and our stories are 5–15k chars.
//  - Chromium cuts a single long utterance off after ~15 seconds.
//  - Chunks give us progress, pause/resume and seeking, which the platform
//    APIs don't expose for one long utterance.

const IS_WEB = Platform.OS === "web";
const RATE = IS_WEB ? 0.9 : 0.85;
const PITCH = 0.95;
const MAX_CHUNK = 220;
// Rough speaking speed at RATE — used to express progress in seconds.
const CHARS_PER_SEC = 13.5;

export function splitIntoChunks(text) {
  const sentences = text
    .replace(/\s+/g, " ")
    // । and ॥ are the Devanagari full stops.
    .split(/(?<=[.!?…।॥])\s+/)
    .filter(Boolean)
    // Hard-split the rare run-on sentence at commas, then spaces.
    .flatMap((s) => (s.length <= MAX_CHUNK ? [s] : s.match(new RegExp(`.{1,${MAX_CHUNK}}(?:[,;]\\s|\\s|$)`, "g")) || [s]));

  const out = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && (buf + " " + s).length > MAX_CHUNK) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = (buf + " " + s).trim();
    }
  }
  if (buf) out.push(buf.trim());
  return out;
}

// ─── Voice selection ─────────────────────────────────────────────────────────
// English (and English-with-Hindi-words): Indian-English voices first (iOS
// ships Rishi/Veena, Edge ships Neerja/Prabhat), then natural/enhanced British,
// Australian and US voices. Hindi: hi-IN voices only (iOS Lekha, Android
// Google Hindi, Edge Swara/Madhur) — an English voice can't read Devanagari.

const VOICE_PREFS = {
  en: { family: "en", order: ["en-IN", "en-GB", "en-AU", "en-US"], platformLang: "en-IN" },
  "en-hi": { family: "en", order: ["en-IN", "en-GB", "en-AU", "en-US"], platformLang: "en-IN" },
  hi: { family: "hi", order: ["hi-IN"], platformLang: "hi-IN" },
};

export class NoVoiceError extends Error {}

function scoreVoice({ lang, name = "", quality = "" }, prefs) {
  const l = (lang || "").replace("_", "-");
  if (!l.startsWith(prefs.family)) return -1;
  const li = prefs.order.findIndex((p) => l.startsWith(p));
  const langScore = li < 0 ? 0 : (prefs.order.length - li) * 10;
  const natural = /natural|enhanced|premium|neural|online|google/i.test(name + quality) ? 5 : 0;
  return langScore + natural;
}

const voicePromises = {};
function getPreferredVoice(language) {
  const prefs = VOICE_PREFS[language] ?? VOICE_PREFS.en;
  if (voicePromises[language]) return voicePromises[language];
  voicePromises[language] = (async () => {
    let candidates;
    if (IS_WEB) {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      if (!synth) return null;
      let voices = synth.getVoices();
      if (!voices.length) {
        voices = await new Promise((resolve) => {
          const done = () => resolve(synth.getVoices());
          synth.addEventListener?.("voiceschanged", done, { once: true });
          setTimeout(done, 1500);
        });
      }
      candidates = voices.map((v) => ({ v, s: scoreVoice({ lang: v.lang, name: v.name }, prefs) }));
    } else {
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      candidates = voices.map((v) => ({ v, s: scoreVoice({ lang: v.language, name: v.name, quality: v.quality }, prefs) }));
    }
    const best = candidates.sort((a, b) => b.s - a.s)[0];
    return best && best.s >= 0 ? best.v : null;
  })();
  return voicePromises[language];
}

export function isSpeechSupported() {
  return !IS_WEB || (typeof window !== "undefined" && !!window.speechSynthesis);
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export function createSpeechEngine({ onStatus }) {
  let chunks = [];
  let offsets = []; // char offset at the start of each chunk
  let totalChars = 0;
  let index = 0;
  let playing = false;
  let token = 0; // bumps on every play/pause/seek so stale callbacks are ignored
  let voice = null;
  let prefs = VOICE_PREFS.en;

  const emit = (extra = {}) =>
    onStatus({
      isPlaying: playing,
      positionSec: (offsets[index] ?? totalChars) / CHARS_PER_SEC,
      durationSec: totalChars / CHARS_PER_SEC,
      ...extra,
    });

  const cancelPlatform = () => {
    try {
      if (IS_WEB) window.speechSynthesis.cancel();
      else Speech.stop();
    } catch {}
  };

  const speakFrom = (myToken) => {
    if (myToken !== token) return;
    if (index >= chunks.length) {
      playing = false;
      index = 0;
      emit({ didJustFinish: true });
      return;
    }
    const next = () => {
      if (myToken !== token) return;
      index++;
      emit();
      speakFrom(myToken);
    };

    if (IS_WEB) {
      const u = new SpeechSynthesisUtterance(chunks[index]);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = RATE;
      u.pitch = PITCH;
      u.onend = next;
      u.onerror = (e) => {
        // cancel() during pause/seek reports "interrupted"/"canceled" — not a real error.
        if (e.error === "interrupted" || e.error === "canceled") return;
        next();
      };
      window.speechSynthesis.speak(u);
    } else {
      Speech.speak(chunks[index], {
        rate: RATE,
        pitch: PITCH,
        voice: voice?.identifier,
        language: voice?.language ?? prefs.platformLang,
        onDone: next,
        onError: next,
      });
    }
  };

  return {
    kind: "speech",

    async load(text, language = "en") {
      prefs = VOICE_PREFS[language] ?? VOICE_PREFS.en;
      token++;
      cancelPlatform();
      chunks = splitIntoChunks(text);
      offsets = [];
      let acc = 0;
      for (const c of chunks) {
        offsets.push(acc);
        acc += c.length + 1;
      }
      totalChars = acc;
      index = 0;
      playing = false;
      if (!isSpeechSupported()) throw new Error("Speech isn't supported in this browser");
      voice = await getPreferredVoice(language);
      // Browsers silently mangle Devanagari with an English voice. On native,
      // passing language "hi-IN" lets the OS use (or offer to download) Hindi.
      if (!voice && IS_WEB && prefs.family !== "en") throw new NoVoiceError(language);
      emit();
    },

    async play() {
      if (playing) return;
      playing = true;
      const myToken = ++token;
      cancelPlatform();
      emit();
      speakFrom(myToken);
    },

    async pause() {
      // Platform pause/resume is unreliable (and absent on Android), so we
      // stop and restart the current sentence group on resume.
      playing = false;
      token++;
      cancelPlatform();
      emit();
    },

    async seekTo(sec) {
      // Speech can only restart at a chunk boundary, and a chunk (~16s) is
      // longer than a 15s skip — so snap to the nearest boundary but always
      // move at least one chunk in the direction asked.
      const targetChar = Math.max(0, sec) * CHARS_PER_SEC;
      let best = 0;
      for (let i = 1; i < offsets.length; i++) {
        if (Math.abs(offsets[i] - targetChar) < Math.abs(offsets[best] - targetChar)) best = i;
      }
      const here = offsets[index] ?? 0;
      if (targetChar > here && best <= index) best = Math.min(index + 1, chunks.length - 1);
      if (targetChar < here && best >= index) best = Math.max(index - 1, 0);
      index = best;
      if (playing) {
        const myToken = ++token;
        cancelPlatform();
        speakFrom(myToken);
      }
      emit();
    },

    async unload() {
      playing = false;
      token++;
      cancelPlatform();
    },
  };
}
