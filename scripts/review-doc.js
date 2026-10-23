#!/usr/bin/env node
/**
 * Writes a human-review document for generated stories in one language/age,
 * so a native speaker can read them (e.g. on GitHub on a phone) before any
 * narration is paid for.
 *
 *   node scripts/review-doc.js --lang=hi --age=3-5
 *   → content-review/hi-3-5.md
 */

const fs = require("fs");
const path = require("path");
const { LANGUAGE_CONFIG } = require("../shared/story-prompt.cjs");

const ROOT = path.join(__dirname, "..");
const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || fallback;
const lang = arg("lang", "hi");
const age = arg("age", "3-5");

const texts = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "stories", `${lang}.json`), "utf8"));
const filmsSrc = fs.readFileSync(path.join(ROOT, "src", "data", "films.js"), "utf8");
const titleOf = (id) => filmsSrc.match(new RegExp(`id: "${id}",\\s*title: "([^"]+)"`))?.[1] ?? id;

const CHECKS = {
  hi: [
    "Sounds like spoken Hindi at bedtime — not textbook or Sanskritised Hindi",
    "No verb forms that assume the child is a boy or a girl (थक गया / थक गई), and none that reveal the narrator's gender (सुनाता / सुनाती)",
    "Nothing scary, violent or romantic for a 3–5 year old",
    "Names and the gist of the film are right",
    "Ends sleepily, with शुभ रात्रि",
  ],
  "en-hi": [
    "The Hindi words are ones families really use with little kids, spelled the usual way in Roman letters",
    "Each Hindi word's meaning is clear the first time it appears",
    "Not too many Hindi words — it should still be an easy English story",
    "Nothing scary, violent or romantic; ends sleepily",
  ],
};

const lines = [
  `# Review: ${LANGUAGE_CONFIG[lang]?.label ?? lang} stories, ages ${age}`,
  "",
  "Read each story and note anything to change — reply with the film name and what's wrong (or \"approved\").",
  "Narration won't be generated until these are approved.",
  "",
  "**What to look for**",
  "",
  ...(CHECKS[lang] || []).map((c) => `- [ ] ${c}`),
  "",
];

for (const [id, byAge] of Object.entries(texts)) {
  const text = byAge[age];
  if (!text) continue;
  const words = text.trim().split(/\s+/).length;
  lines.push("---", "", `## ${titleOf(id)}`, "", `_${words} words · ${text.length.toLocaleString()} characters_`, "", text.trim(), "");
}

const outDir = path.join(ROOT, "content-review");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${lang}-${age}.md`);
fs.writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${path.relative(ROOT, out)}`);
