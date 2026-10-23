// Proxies story generation to Anthropic so the API key never reaches the client.
// Set ANTHROPIC_API_KEY in the Netlify dashboard (Site settings → Environment variables).

import storyPrompt from "../../shared/story-prompt.cjs";

const { buildStoryPrompt, AGE_KEYS, LANGUAGE_KEYS } = storyPrompt;

// Film titles: letters in any script, digits, spaces and light punctuation.
// No quotes, brackets or newlines — the title is embedded in the prompt, so
// this keeps "titles" from smuggling in instructions.
const TITLE_RE = /^[\p{L}\p{M}\p{N} .,:!?&'-]{1,60}$/u;

// Best-effort abuse brake. Function instances are short-lived and not shared,
// so this only stops bursts from one client hitting a warm instance; a real
// per-device quota needs shared storage (e.g. Netlify Blobs) — see CLAUDE.md.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 12;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { ageRange = "6-8", language = "en" } = body;
  const movieName = typeof body.movieName === "string" ? body.movieName.trim().replace(/\s+/g, " ") : "";
  if (!movieName) return json({ error: "Please type the name of a film." }, 400);
  if (!TITLE_RE.test(movieName)) {
    return json({ error: "That doesn't look like a film title — try just the film's name." }, 400);
  }
  if (!AGE_KEYS.includes(ageRange) || !LANGUAGE_KEYS.includes(language)) {
    return json({ error: "Unsupported age or language." }, 400);
  }

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (rateLimited(ip)) {
    return json({ error: "That's a lot of new stories! Please try again in a little while." }, 429);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "Server misconfigured: missing API key" }, 500);

  const prompt = `FIRST, validate the movie name. If "${movieName}" is not a real Bollywood film — for example random characters, gibberish, or clearly not a film title — respond with EXACTLY one line and nothing else:
NOT_A_FILM: <one short, friendly sentence explaining why, addressed to the parent>

Otherwise, ignore the above and proceed with the bedtime story below.

${buildStoryPrompt(movieName, ageRange, language)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      // Devanagari costs several times more tokens per word than English.
      max_tokens: language === "hi" ? 12000 : 4096,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return json(
      { error: errData?.error?.message || "Story generation failed" },
      res.status
    );
  }

  // Pass Anthropic's SSE stream straight through. The response object is
  // returned synchronously, so the function "completes" in milliseconds and
  // the 10s production timeout never fires — the stream itself can run for
  // however long Anthropic needs.
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
};
