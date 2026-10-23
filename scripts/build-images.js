#!/usr/bin/env node
/**
 * Builds every raster image the app ships:
 *   - assets/illustrations/*.png → *.jpg (story artwork, ~10x smaller)
 *   - assets/icon.png, adaptive-icon.png, splash-icon.png, favicon.png
 *     rendered from the vector brand mark below.
 *
 *   node scripts/build-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS = path.join(__dirname, "..", "assets");
const BRAND_DIR = path.join(ASSETS, "brand");

// ─── Brand mark ───────────────────────────────────────────────────────────────
// A warm crescent moon under a string of festive lights (a nod to the toran /
// Diwali lights strung over doorways) on a deep-indigo night sky.

function sparkle(cx, cy, r, opacity = 1) {
  const k = r * 0.28;
  return `<path d="M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z" fill="#FCD89D" opacity="${opacity}"/>`;
}

function lights() {
  // Catenary-ish string across the top with glowing bulbs.
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = 120 + t * 784;
    const y = 84 + Math.sin(t * Math.PI) * 44;
    pts.push([x, y]);
  }
  const string = `<path d="M${pts.map((p) => p.join(" ")).join(" L")}" stroke="#F6A623" stroke-opacity="0.35" stroke-width="5" fill="none"/>`;
  const bulbs = pts
    .slice(1, -1)
    .map(([x, y], i) => {
      const c = i % 2 ? "#FCD89D" : "#E8783A";
      return `<circle cx="${x}" cy="${y + 22}" r="34" fill="${c}" opacity="0.18"/><circle cx="${x}" cy="${y + 22}" r="15" fill="${c}"/>`;
    })
    .join("");
  return string + bulbs;
}

function moon(cx, cy, r) {
  return `
    <defs>
      <linearGradient id="moonFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFE7B8"/>
        <stop offset="0.55" stop-color="#FCD89D"/>
        <stop offset="1" stop-color="#F6A623"/>
      </linearGradient>
      <radialGradient id="moonGlow">
        <stop offset="0" stop-color="#F6A623" stop-opacity="0.45"/>
        <stop offset="1" stop-color="#F6A623" stop-opacity="0"/>
      </radialGradient>
      <mask id="crescent">
        <rect width="1024" height="1024" fill="white"/>
        <circle cx="${cx + r * 0.42}" cy="${cy - r * 0.3}" r="${r * 0.86}" fill="black"/>
      </mask>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.75}" fill="url(#moonGlow)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonFill)" mask="url(#crescent)"/>`;
}

// The jharokha (arched window) used throughout the app, with a painted inset.
function archPath(x0, x1, top, bottom, r = 36) {
  const w = x1 - x0;
  const R = w / 2;
  return `M${x0} ${bottom - r} L${x0} ${top + R} A${R} ${R} 0 0 1 ${x1} ${top + R} L${x1} ${bottom - r} Q${x1} ${bottom} ${x1 - r} ${bottom} L${x0 + r} ${bottom} Q${x0} ${bottom} ${x0} ${bottom - r} Z`;
}

function windowMark() {
  return `
    <defs>
      <linearGradient id="pane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2B2B6B"/><stop offset="1" stop-color="#151540"/>
      </linearGradient>
    </defs>
    <path d="${archPath(262, 762, 214, 862)}" fill="url(#pane)" stroke="#FFCF7D" stroke-opacity="0.55" stroke-width="10"/>
    <path d="${archPath(292, 732, 244, 832, 20)}" fill="none" stroke="#FFCF7D" stroke-opacity="0.45" stroke-width="5"/>
    ${moon(500, 560, 168)}
    ${sparkle(650, 430, 30)}
    ${sparkle(372, 400, 20, 0.85)}
    ${sparkle(640, 720, 16, 0.7)}`;
}

function iconSvg({ background = true, scale = 1 } = {}) {
  const bg = background
    ? `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#1A1A4D"/><stop offset="1" stop-color="#08071C"/>
       </linearGradient></defs>
       <rect width="1024" height="1024" fill="url(#sky)"/>
       ${lights()}`
    : "";
  const content = windowMark();
  const s = scale;
  const t = (1024 * (1 - s)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${bg}
    <g transform="translate(${t} ${t}) scale(${s})">${content}</g>
  </svg>`;
}

async function buildBrand() {
  fs.mkdirSync(BRAND_DIR, { recursive: true });
  const full = iconSvg();
  // Android adaptive icons crop to the centre ~66%, so shrink the mark.
  const adaptive = iconSvg({ background: false, scale: 0.72 });
  const splash = iconSvg({ background: false, scale: 1 });

  fs.writeFileSync(path.join(BRAND_DIR, "icon.svg"), full);
  await sharp(Buffer.from(full)).png().toFile(path.join(ASSETS, "icon.png"));
  await sharp(Buffer.from(adaptive)).png().toFile(path.join(ASSETS, "adaptive-icon.png"));
  await sharp(Buffer.from(splash)).png().toFile(path.join(ASSETS, "splash-icon.png"));
  await sharp(Buffer.from(full)).resize(64, 64).png().toFile(path.join(ASSETS, "favicon.png"));
  console.log("Brand: icon.png, adaptive-icon.png, splash-icon.png, favicon.png");
}

async function buildIllustrations() {
  const dir = path.join(ASSETS, "illustrations");
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".png")) continue;
    const src = path.join(dir, file);
    const out = src.replace(/\.png$/, ".jpg");
    await sharp(src).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    const before = fs.statSync(src).size;
    fs.unlinkSync(src);
    console.log(`${file} → ${path.basename(out)}  ${(before / 1e6).toFixed(1)} MB → ${(fs.statSync(out).size / 1e3).toFixed(0)} KB`);
  }
}

(async () => {
  await buildIllustrations();
  await buildBrand();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
