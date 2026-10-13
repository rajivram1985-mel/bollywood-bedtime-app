#!/usr/bin/env node
/**
 * Generates bundled bedtime stories — text via Claude, optional narration via
 * ElevenLabs — for every film × age range, skipping anything already present.
 *
 *   node scripts/generate-stories.js                       # missing TEXT for all ages
 *   node scripts/generate-stories.js --ages=3-5,9-12        # only these ages
 *   node scripts/generate-stories.js --films=ddlj,sholay    # only these films
 *   node scripts/generate-stories.js --audio                # also narrate missing audio (costs ElevenLabs credits)
 *   node scripts/generate-stories.js --dry-run              # print what would be generated + character count
 *
 * Output:
 *   src/data/storyTexts.json         — { [filmId]: { [ageRange]: text } }
 *   assets/audio/<filmId>-<age>.mp3  — raw ElevenLabs narration (run scripts/optimize-audio.js after)
 *   src/data/storyAudio.js           — regenerated require() manifest of all bundled audio
 *
 * To add a new film: add it to FILMS below AND to src/data/films.js (with an illustration).
 */

const fs = require("fs");
const path = require("path");
const { AGE_KEYS, buildStoryPrompt } = require("../shared/story-prompt.cjs");
const { writeAudioManifest } = require("./lib/audio-manifest");

const ROOT = path.join(__dirname, "..");
const TEXTS_PATH = path.join(ROOT, "src", "data", "storyTexts.json");
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
  return {
    ages: get("ages") || AGE_KEYS,
    films: get("films"),
    audio: args.includes("--audio"),
    dryRun: args.includes("--dry-run"),
  };
}

// ─── Claude: story text ───────────────────────────────────────────────────────
async function generateText(promptTitle, ageRange) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildStoryPrompt(promptTitle, ageRange) }],
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
async function generateAudio(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
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
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || `Audio generation failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function hasAudio(filmId, age) {
  return ["m4a", "mp3"].some((ext) => fs.existsSync(path.join(AUDIO_DIR, `${filmId}-${age}.${ext}`)));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const opts = parseArgs();
  const texts = fs.existsSync(TEXTS_PATH) ? JSON.parse(fs.readFileSync(TEXTS_PATH, "utf8")) : {};
  const films = opts.films ? FILMS.filter((f) => opts.films.includes(f.id)) : FILMS;

  const textJobs = [];
  const audioJobs = [];
  for (const film of films) {
    for (const age of opts.ages) {
      if (!texts[film.id]?.[age]) textJobs.push({ film, age });
      if (opts.audio && !hasAudio(film.id, age)) audioJobs.push({ film, age });
    }
  }

  console.log(`📝 ${textJobs.length} stories to write, 🎙️ ${audioJobs.length} to narrate`);
  if (opts.dryRun) {
    const chars = audioJobs.reduce((n, { film, age }) => n + (texts[film.id]?.[age]?.length || 0), 0);
    for (const j of textJobs) console.log(`   text  ${j.film.id} ${j.age}`);
    for (const j of audioJobs) console.log(`   audio ${j.film.id} ${j.age}`);
    console.log(`   ElevenLabs characters for stories that already have text: ${chars.toLocaleString()}`);
    return;
  }

  if (textJobs.length && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  if (audioJobs.length && (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID)) {
    throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required for --audio");
  }

  // Text: run a few in parallel, save after each so a failure never loses work.
  const queue = [...textJobs];
  const worker = async () => {
    while (queue.length) {
      const { film, age } = queue.shift();
      try {
        const text = await generateText(film.promptTitle, age);
        texts[film.id] = { ...(texts[film.id] || {}), [age]: text };
        fs.writeFileSync(TEXTS_PATH, JSON.stringify(texts, null, 2) + "\n");
        console.log(`   ✅ ${film.id} ${age} — ${text.split(/\s+/).length} words`);
      } catch (e) {
        console.log(`   ❌ ${film.id} ${age} — ${e.message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  // Audio: sequential (ElevenLabs concurrency limits are low on most plans).
  for (const { film, age } of audioJobs) {
    const text = texts[film.id]?.[age];
    if (!text) continue;
    process.stdout.write(`   🎙️ ${film.id} ${age} (${text.length.toLocaleString()} chars)… `);
    const buf = await generateAudio(text);
    fs.writeFileSync(path.join(AUDIO_DIR, `${film.id}-${age}.mp3`), buf);
    console.log(`${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  }

  writeAudioManifest();
  console.log("🎉 Done. If you narrated new audio, run: node scripts/optimize-audio.js");
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
