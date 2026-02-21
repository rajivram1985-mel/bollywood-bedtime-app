#!/usr/bin/env node
/**
 * Pre-generates bedtime stories + narrated audio for 5 Bollywood movies.
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in your API keys + voice ID
 *   2. Run:  node scripts/generate-prebuilt.js
 *
 * Output:
 *   assets/audio/*.mp3              — narrated MP3 files
 *   src/constants/prebuiltStories.js — story text + audio asset refs
 */

const fs = require("fs");
const path = require("path");

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error(
      "❌  No .env file found.\n" +
        "    Copy .env.example → .env and fill in your API keys."
    );
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

if (!ANTHROPIC_KEY || !ELEVENLABS_KEY || !VOICE_ID) {
  console.error(
    "❌  Missing required env vars.\n" +
      "    Need: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID"
  );
  process.exit(1);
}

// ─── Movies to pre-generate ───────────────────────────────────────────────────
const MOVIES = [
  { name: "DDLJ",               filename: "ddlj"   },
  { name: "Sholay",             filename: "sholay" },
  { name: "3 Idiots",           filename: "3idiots" },
  { name: "Kuch Kuch Hota Hai", filename: "kkhh"   },
  { name: "Lagaan",             filename: "lagaan" },
];

const AGE_RANGE = "6-8";

const AGE_CONFIG = {
  "3-5": {
    audience: "a young child aged 3-5",
    wordCount: "~1000",
    complexity:
      "Use very simple words and short sentences. Repeat key phrases for comfort. Keep descriptions vivid but easy to picture.",
    opening: "Okay little one, snuggle up tight...",
  },
  "6-8": {
    audience: "kids aged 6-8",
    wordCount: "~1800",
    complexity:
      'Use fun, playful vocabulary. Sentences can be medium length. Add little asides like "Can you believe that?" or "Guess what happened next!"',
    opening: "Alright, snuggle up little ones...",
  },
  "9-12": {
    audience: "kids aged 9-12",
    wordCount: "~2500",
    complexity:
      "Use richer language and more detailed descriptions. Include clever wordplay and humor. You can explore emotions and motivations more deeply.",
    opening: "Alright, settle in and get comfy...",
  },
};

// ─── Claude: generate story text ─────────────────────────────────────────────
async function generateStory(movieName) {
  const age = AGE_CONFIG[AGE_RANGE];
  const prompt =
    `You are a warm, loving parent telling a bedtime story to ${age.audience} based on the Bollywood movie "${movieName}".\n\n` +
    `RULES:\n` +
    `- Rewrite the movie's plot as a cozy, fun bedtime story (${age.wordCount} words)\n` +
    `- Use a casual, conversational tone as if a parent is reading to kids snuggled in bed\n` +
    `- ${age.complexity}\n` +
    `- Turn any romantic/sexual subplots into friendship stories\n` +
    `- Make all villains silly and cartoonish — bumbling, funny, not scary\n` +
    `- Remove any violence, replace with funny or clever solutions\n` +
    `- Keep the core adventure and emotional beats of the movie\n` +
    `- Start with "${age.opening}" or something similar\n` +
    `- End with a gentle, sleepy conclusion that helps kids drift off to sleep\n` +
    `- Do NOT include any stage directions, narrator labels, or formatting — just the story text as spoken words\n\n` +
    `Write the bedtime story now:`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Story generation failed (${res.status})`);
  }
  const data = await res.json();
  return data.content.map((b) => b.text || "").join("\n");
}

// ─── ElevenLabs: generate audio ───────────────────────────────────────────────
async function generateAudio(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || `Audio generation failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const audioDir = path.join(__dirname, "..", "assets", "audio");
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const results = [];

  for (const movie of MOVIES) {
    console.log(`\n🎬  ${movie.name}`);

    // Story
    process.stdout.write("    📝 Generating story... ");
    const text = await generateStory(movie.name);
    const wordCount = text.trim().split(/\s+/).length;
    console.log(`done (${wordCount} words)`);

    // Audio
    process.stdout.write("    🎙️  Generating audio... ");
    const audioBuffer = await generateAudio(text);
    const audioPath = path.join(audioDir, `${movie.filename}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);
    console.log(`done (${(audioBuffer.length / 1024).toFixed(0)} KB)`);

    results.push({ movieName: movie.name, filename: movie.filename, text });
  }

  // Write src/constants/prebuiltStories.js
  const lines = [
    "// Auto-generated by scripts/generate-prebuilt.js — do not edit manually.",
    `// Generated: ${new Date().toISOString()}`,
    "export const PREBUILT_STORIES = [",
  ];

  for (const s of results) {
    lines.push("  {");
    lines.push(`    movieName: ${JSON.stringify(s.movieName)},`);
    lines.push(`    ageRange: ${JSON.stringify(AGE_RANGE)},`);
    lines.push(`    text: ${JSON.stringify(s.text)},`);
    lines.push(`    audio: require("../../assets/audio/${s.filename}.mp3"),`);
    lines.push("  },");
  }

  lines.push("];");

  const outPath = path.join(
    __dirname,
    "..",
    "src",
    "constants",
    "prebuiltStories.js"
  );
  fs.writeFileSync(outPath, lines.join("\n") + "\n");

  console.log("\n✅  Written: src/constants/prebuiltStories.js");
  console.log("🎉  All done! Restart Expo to pick up the new audio assets.");
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
