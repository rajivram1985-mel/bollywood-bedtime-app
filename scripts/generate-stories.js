#!/usr/bin/env node
/**
 * Generates bundled bedtime stories — text via Claude, optional narration via
 * ElevenLabs — for every film × age × language, skipping anything already present.
 *
 *   node scripts/generate-stories.js                       # missing English TEXT for all ages
 *   node scripts/generate-stories.js --langs=hi,en-hi       # these languages (en, en-hi, hi)
 *   node scripts/generate-stories.js --ages=3-5,9-12        # only these ages
 *   node scripts/generate-stories.js --films=ddlj,sholay    # only these films
 *   node scripts/generate-stories.js --audio                # also narrate missing audio (costs ElevenLabs credits)
 *   node scripts/generate-stories.js --dry-run              # print what would be generated + character count
 *
 * Output:
 *   src/data/stories/<lang>.json              — { [filmId]: { [ageRange]: text } }
 *   assets/audio/<filmId>-<age>[-<lang>].mp3  — raw narration; English has no suffix
 *                                               (run scripts/optimize-audio.js after)
 *   src/data/storyAudio.js                    — regenerated require() manifest of all bundled audio
 *
 * Voices: ELEVENLABS_VOICE_ID is the default. Set ELEVENLABS_VOICE_ID_HI (and
 * ELEVENLABS_VOICE_ID_EN_HI) to use a native-accent voice for that language —
 * an English voice reading Hindi sounds foreign.
 *
 * To add a new film: add it to FILMS below AND to src/data/films.js (with an illustration).
 */

const fs = require("fs");
const path = require("path");
const { AGE_KEYS, LANGUAGE_KEYS, buildStoryPrompt } = require("../shared/story-prompt.cjs");
const { writeAudioManifest, audioBaseName } = require("./lib/audio-manifest");

const ROOT = path.join(__dirname, "..");
const TEXTS_DIR = path.join(ROOT, "src", "data", "stories");
const AUDIO_DIR = path.join(ROOT, "assets", "audio");

// filmId must match src/data/films.js; promptTitle is what Claude sees.
const FILMS = [
  { id: "ddlj",     promptTitle: "DDLJ (Dilwale Dulhania Le Jayenge)" },
  { id: "sholay",   promptTitle: "Sholay" },
  { id: "3idiots",  promptTitle: "3 Idiots" },
  { id: "kkhh",     promptTitle: "Kuch Kuch Hota Hai" },
  { id: "lagaan",   promptTitle: "Lagaan" },
  { id: "tzp",      promptTitle: "Taare Zameen Par" },
  { id: "dangal",   promptTitle: "Dangal" },
  { id: "bajrangi", promptTitle: "Bajrangi Bhaijaan" },
  { id: "pathaan",  promptTitle: "Pathaan" },
  { id: "jawan",    promptTitle: "Jawan" },
];

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean) : null;
  };
  const langs = get("langs") || ["en"];
  const unknown = langs.filter((l) => !LANGUAGE_KEYS.includes(l));
  if (unknown.length) throw new Error(`Unknown language(s): ${unknown.join(", ")} — expected ${LANGUAGE_KEYS.join(", ")}`);
  return {
    langs,
    ages: get("ages") || AGE_KEYS,
    films: get("films"),
    audio: args.includes("--audio"),
    dryRun: args.includes("--dry-run"),
  };
}

const textsPath = (lang) => path.join(TEXTS_DIR, `${lang}.json`);
const loadTexts = (lang) => (fs.existsSync(textsPath(lang)) ? JSON.parse(fs.readFileSync(textsPath(lang), "utf8")) : {});

function voiceFor(lang) {
  const specific = process.env[`ELEVENLABS_VOICE_ID_${lang.toUpperCase().replace(/-/g, "_")}`];
  return specific || process.env.ELEVENLABS_VOICE_ID;
}

// ─── Claude: story text ───────────────────────────────────────────────────────
async function generateText(promptTitle, ageRange, lang) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      // Devanagari costs more tokens per word than English.
      max_tokens: lang === "hi" ? 12000 : 4096,
      messages: [{ role: "user", content: buildStoryPrompt(promptTitle, ageRange, lang) }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Story generation failed (${res.status})`);
  }
  const data = await res.json();
  if (data.stop_reason === "max_tokens") {
    throw new Error("Story was cut off at max_tokens — not saving a truncated story");
  }
  return data.content.map((b) => b.text || "").join("\n").trim();
}

// ─── ElevenLabs: narration ────────────────────────────────────────────────────
// eleven_multilingual_v2 accepts at most 10,000 characters per request, and
// 9-12 stories run ~15k. Long stories are split at paragraph breaks and the
// MP3 parts concatenated (optimize-audio.js re-encodes the joined file).
// previous_text/next_text keep the narration's intonation continuous.
const MAX_REQUEST_CHARS = 9000;

function splitForNarration(text) {
  if (text.length <= MAX_REQUEST_CHARS) return [text];
  const parts = [];
  let buf = "";
  for (const para of text.split(/\n\s*\n/)) {
    if (buf && buf.length + para.length + 2 > MAX_REQUEST_CHARS) {
      parts.push(buf);
      buf = para;
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

async function generateAudio(text, voiceId) {
  const parts = splitForNarration(text);
  const buffers = [];
  for (let i = 0; i < parts.length; i++) {
    buffers.push(
      await requestAudio(parts[i], voiceId, {
        previous_text: parts[i - 1]?.slice(-1000),
        next_text: parts[i + 1]?.slice(0, 1000),
      })
    );
  }
  return Buffer.concat(buffers);
}

async function requestAudio(text, voiceId, context = {}) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
      ...context,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || `Audio generation failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function hasAudio(filmId, age, lang) {
  const base = audioBaseName(filmId, age, lang);
  return ["m4a", "mp3"].some((ext) => fs.existsSync(path.join(AUDIO_DIR, `${base}.${ext}`)));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const opts = parseArgs();
  const films = opts.films ? FILMS.filter((f) => opts.films.includes(f.id)) : FILMS;
  const texts = Object.fromEntries(opts.langs.map((l) => [l, loadTexts(l)]));

  const textJobs = [];
  const audioJobs = [];
  for (const lang of opts.langs) {
    for (const film of films) {
      for (const age of opts.ages) {
        if (!texts[lang][film.id]?.[age]) textJobs.push({ film, age, lang });
        if (opts.audio && !hasAudio(film.id, age, lang)) audioJobs.push({ film, age, lang });
      }
    }
  }

  console.log(`📝 ${textJobs.length} stories to write, 🎙️ ${audioJobs.length} to narrate`);
  if (opts.dryRun) {
    const chars = audioJobs.reduce((n, j) => n + (texts[j.lang][j.film.id]?.[j.age]?.length || 0), 0);
    for (const j of textJobs) console.log(`   text  ${j.lang} ${j.film.id} ${j.age}`);
    for (const j of audioJobs) console.log(`   audio ${j.lang} ${j.film.id} ${j.age}  voice=${voiceFor(j.lang) ? "set" : "MISSING"}`);
    console.log(`   ElevenLabs characters for stories that already have text: ${chars.toLocaleString()}`);
    return;
  }

  if (textJobs.length && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  if (audioJobs.length) {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is required for --audio");
    if (!process.env.ELEVENLABS_API_KEY.startsWith("sk_")) {
      throw new Error(
        "ELEVENLABS_API_KEY doesn't look like a secret key (they start with 'sk_'). " +
          "The dashboard's key ID won't work — create a key under Developers → API Keys and copy it when shown."
      );
    }
    const missing = [...new Set(audioJobs.map((j) => j.lang))].filter((l) => !voiceFor(l));
    if (missing.length) throw new Error(`No ElevenLabs voice configured for: ${missing.join(", ")}`);
  }

  // Text: run a few in parallel, save after each so a failure never loses work.
  fs.mkdirSync(TEXTS_DIR, { recursive: true });
  const queue = [...textJobs];
  const worker = async () => {
    while (queue.length) {
      const { film, age, lang } = queue.shift();
      try {
        const text = await generateText(film.promptTitle, age, lang);
        texts[lang][film.id] = { ...(texts[lang][film.id] || {}), [age]: text };
        fs.writeFileSync(textsPath(lang), JSON.stringify(texts[lang], null, 2) + "\n");
        console.log(`   ✅ ${lang} ${film.id} ${age} — ${text.split(/\s+/).length} words, ${text.length} chars`);
      } catch (e) {
        console.log(`   ❌ ${lang} ${film.id} ${age} — ${e.message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  // Audio: sequential (ElevenLabs concurrency limits are low on most plans).
  for (const { film, age, lang } of audioJobs) {
    const text = texts[lang][film.id]?.[age];
    if (!text) continue;
    process.stdout.write(`   🎙️ ${lang} ${film.id} ${age} (${text.length.toLocaleString()} chars)… `);
    const buf = await generateAudio(text, voiceFor(lang));
    fs.writeFileSync(path.join(AUDIO_DIR, `${audioBaseName(film.id, age, lang)}.mp3`), buf);
    console.log(`${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  }

  writeAudioManifest();
  console.log("🎉 Done. If you narrated new audio, run: node scripts/optimize-audio.js");
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
