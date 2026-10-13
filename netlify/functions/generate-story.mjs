// Proxies story generation to Anthropic so the API key never reaches the client.
// Set ANTHROPIC_API_KEY in the Netlify dashboard (Site settings → Environment variables).

import storyPrompt from "../../shared/story-prompt.cjs";

const { buildStoryPrompt } = storyPrompt;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { movieName, ageRange = "6-8" } = body;
  if (!movieName || typeof movieName !== "string") {
    return json({ error: "movieName is required" }, 400);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "Server misconfigured: missing API key" }, 500);

  const prompt = `FIRST, validate the movie name. If "${movieName}" is not a real Bollywood film — for example random characters, gibberish, or clearly not a film title — respond with EXACTLY one line and nothing else:
NOT_A_FILM: <one short, friendly sentence explaining why, addressed to the parent>

Otherwise, ignore the above and proceed with the bedtime story below.

${buildStoryPrompt(movieName, ageRange)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
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
