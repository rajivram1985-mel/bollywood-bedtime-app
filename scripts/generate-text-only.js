#!/usr/bin/env node
/**
 * Generates bedtime story TEXT ONLY (no audio) for 5 Bollywood movies.
 * Uses Anthropic API only — no ElevenLabs needed.
 * Stories are appended to src/constants/prebuiltStories.js with audio: null.
 *
 * Run:  node scripts/generate-text-only.js
 */

const fs = require("fs");
const path = require("path");

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌  No .env file found. Copy .env.example → .env and add ANTHROPIC_API_KEY.");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error("❌  ANTHROPIC_API_KEY not set in .env");
  process.exit(1);
}

// ─── New movies (text only — no ElevenLabs audio) ────────────────────────────
const MOVIES = [
  { name: "Taare Zameen Par",  filename: "tzp"      },
  { name: "Dangal",            filename: "dangal"   },
  { name: "Bajrangi Bhaijaan", filename: "bajrangi" },
  { name: "Pathaan",           filename: "pathaan"  },
  { name: "Jawan",             filename: "jawan"    },
];

const AGE_RANGE = "6-8";

const AGE_CONFIG = {
  "6-8": {
    audience: "kids aged 6-8",
    wordCount: "~1800",
    complexity:
      'Use fun, playful vocabulary. Sentences can be medium length. Add little asides like "Can you believe that?" or "Guess what happened next!"',
    opening: "Alright, snuggle up little ones...",
  },
};

// ─── Generate story text via Claude ──────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const outPath = path.join(__dirname, "..", "src", "constants", "prebuiltStories.js");

  // Read existing file to extract current stories
  let existing = fs.readFileSync(outPath, "utf8");

  // Remove the closing ]; so we can append
  existing = existing.trimEnd().replace(/\];?\s*$/, "").trimEnd();

  const newEntries = [];

  for (const movie of MOVIES) {
    console.log(`\n🎬  ${movie.name}`);
    process.stdout.write("    📝 Generating story... ");

    const text = await generateStory(movie.name);
    const wordCount = text.trim().split(/\s+/).length;
    console.log(`done (${wordCount} words)`);

    newEntries.push({ movieName: movie.name, text });
  }

  // Append new entries
  let appended = existing;
  for (const s of newEntries) {
    appended += `\n  {\n`;
    appended += `    movieName: ${JSON.stringify(s.movieName)},\n`;
    appended += `    ageRange: ${JSON.stringify(AGE_RANGE)},\n`;
    appended += `    text: ${JSON.stringify(s.text)},\n`;
    appended += `    audio: null,\n`;
    appended += `  },`;
  }
  appended += "\n];\n";

  fs.writeFileSync(outPath, appended);

  console.log("\n✅  Written: src/constants/prebuiltStories.js");
  console.log("🎉  Done! The 5 new stories use expo-speech for narration.");
}

main().catch((err) => {
  console.error("\n❌ ", err.message);
  process.exit(1);
});
