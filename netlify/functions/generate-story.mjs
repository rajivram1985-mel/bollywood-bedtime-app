// Proxies story generation to Anthropic so the API key never reaches the client.
// Set ANTHROPIC_API_KEY in the Netlify dashboard (Site settings → Environment variables).

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

  const age = AGE_CONFIG[ageRange] || AGE_CONFIG["6-8"];

  const storyPrompt = `You are a warm, loving parent telling a bedtime story to ${age.audience} based on the Bollywood movie "${movieName}".

RULES:
- Rewrite the movie's plot as a cozy, fun bedtime story (${age.wordCount} words)
- Use a casual, conversational tone as if a parent is reading to kids snuggled in bed
- ${age.complexity}
- Turn any romantic/sexual subplots into friendship stories
- Make all villains silly and cartoonish — bumbling, funny, not scary
- Remove any violence, replace with funny or clever solutions
- Keep the core adventure and emotional beats of the movie
- Start with "${age.opening}" or something similar
- End with a gentle, sleepy conclusion that helps kids drift off to sleep
- Do NOT include any stage directions, narrator labels, or formatting — just the story text as spoken words

Write the bedtime story now:`;

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
      messages: [{ role: "user", content: storyPrompt }],
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
