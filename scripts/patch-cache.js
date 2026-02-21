const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "constants", "prebuiltStories.js"),
  "utf8"
);
const cachePath = path.join(__dirname, "..", "assets", "audio", "stories-cache.json");
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));

const entries = [
  { filename: "kkhh",   movieName: "Kuch Kuch Hota Hai" },
  { filename: "lagaan", movieName: "Lagaan" },
];

for (const { filename, movieName } of entries) {
  if (cache[filename]) {
    console.log(`Already cached: ${filename}`);
    continue;
  }

  const anchor = `movieName: ${JSON.stringify(movieName)}`;
  const idx = src.indexOf(anchor);
  if (idx === -1) { console.log(`Not found: ${movieName}`); continue; }

  const textKey = "text: ";
  const textStart = src.indexOf(textKey, idx) + textKey.length;

  // Walk the JSON string char by char
  let i = textStart + 1; // skip opening quote
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === '"') break;
    i++;
  }
  const jsonStr = src.slice(textStart, i + 1);
  const text = JSON.parse(jsonStr);
  cache[filename] = text;
  console.log(`Added ${filename} (${text.split(" ").length} words)`);
}

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
console.log("Cache keys:", Object.keys(cache));
