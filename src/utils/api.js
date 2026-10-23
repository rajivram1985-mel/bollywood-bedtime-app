import { Platform } from "react-native";
import { fetch as expoFetch } from "expo/fetch";

// On web the function lives on the same origin, so a relative path works.
// Native apps have no origin: set EXPO_PUBLIC_API_BASE_URL to the deployed
// site (e.g. https://bollywood-bedtime.netlify.app). Without it, the
// "make a story" feature is hidden on native rather than shown broken.
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const IS_WEB = Platform.OS === "web";

export const canGenerateStories = IS_WEB || !!API_BASE;

// React Native's built-in fetch has no streaming body; expo/fetch does.
const streamingFetch = IS_WEB ? (...args) => globalThis.fetch(...args) : expoFetch;

const NOT_A_FILM_FALLBACK =
  "That doesn't look like a Bollywood film I recognise. Double-check the spelling and try again.";

// Minimal streaming UTF-8 decoder — Hermes doesn't reliably ship TextDecoder,
// and Devanagari stories are all multi-byte characters split across chunks.
function createUtf8Decoder() {
  if (typeof TextDecoder !== "undefined") {
    const d = new TextDecoder();
    return (bytes) => d.decode(bytes, { stream: true });
  }
  let carry = [];
  return (bytes) => {
    const all = carry.length ? [...carry, ...bytes] : bytes;
    let out = "";
    let i = 0;
    while (i < all.length) {
      const b = all[i];
      const len = b < 0x80 ? 1 : b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : b >= 0xc0 ? 2 : 1;
      if (i + len > all.length) break; // incomplete sequence — wait for next chunk
      let cp = len === 1 ? b : b & (0xff >> (len + 1));
      for (let k = 1; k < len; k++) cp = (cp << 6) | (all[i + k] & 0x3f);
      out += String.fromCodePoint(cp);
      i += len;
    }
    carry = Array.from(all.slice(i));
    return out;
  };
}

export async function generateStory(movieName, ageRange = "6-8", language = "en") {
  const res = await streamingFetch(`${API_BASE}/.netlify/functions/generate-story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movieName, ageRange, language }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "Failed to generate story");
  }

  // Read Anthropic's SSE stream and accumulate text_delta events.
  const reader = res.body.getReader();
  const decode = createUtf8Decoder();
  let text = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decode(value);

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        text += event.delta.text;
        // Early-abort if the model signalled an unrecognised film. The marker
        // arrives within the first ~12 chars, so we can stop as soon as we
        // have enough text to rule it out.
        if (text.length >= 12 && text.trimStart().startsWith("NOT_A_FILM:")) {
          await reader.cancel().catch(() => {});
          const reason = text.replace(/^\s*NOT_A_FILM:\s*/, "").trim();
          throw new Error(reason || NOT_A_FILM_FALLBACK);
        }
      } else if (event.type === "error") {
        throw new Error(event.error?.message || "Streaming error");
      }
    }
  }

  if (text.trimStart().startsWith("NOT_A_FILM:")) {
    const reason = text.replace(/^\s*NOT_A_FILM:\s*/, "").trim();
    throw new Error(reason || NOT_A_FILM_FALLBACK);
  }

  if (!text) throw new Error("No story generated");
  return text;
}
