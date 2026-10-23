#!/usr/bin/env node
/**
 * Re-encodes raw ElevenLabs MP3 narration (128 kbps) into speech-optimised
 * AAC (.m4a, 56 kbps mono) — roughly 60% smaller with no audible loss for a
 * single voice — then deletes the source MP3 and regenerates the manifest.
 *
 *   node scripts/optimize-audio.js
 *
 * Also migrates legacy names (ddlj.mp3 → ddlj-6-8.m4a).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ffmpeg = require("ffmpeg-static");
const { writeAudioManifest, parseAudioName } = require("./lib/audio-manifest");

const AUDIO_DIR = path.join(__dirname, "..", "assets", "audio");
const LEGACY_AGE = "6-8"; // the original bundled stories were all written for 6-8

for (const file of fs.readdirSync(AUDIO_DIR)) {
  if (!file.endsWith(".mp3")) continue;
  const base = file.replace(/\.mp3$/, "");
  const target = parseAudioName(file) ? base : `${base}-${LEGACY_AGE}`;
  const src = path.join(AUDIO_DIR, file);
  const out = path.join(AUDIO_DIR, `${target}.m4a`);

  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error",
    "-i", src,
    "-ac", "1", "-c:a", "aac", "-b:a", "56k",
    "-movflags", "+faststart", // moov atom first so playback starts before full download on web
    out,
  ]);
  const before = fs.statSync(src).size;
  const after = fs.statSync(out).size;
  fs.unlinkSync(src);
  console.log(`${file} → ${target}.m4a  ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`);
}

writeAudioManifest();
console.log("Wrote src/data/storyAudio.js");
