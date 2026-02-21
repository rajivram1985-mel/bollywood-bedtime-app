const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const ANTHROPIC_BASE = "https://api.anthropic.com/v1";

export async function fetchVoices(apiKey) {
  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": apiKey },
  });
  if (res.status === 401) throw new Error("INVALID_KEY");
  if (!res.ok) throw new Error("API_ERROR");
  const data = await res.json();
  if (!data.voices || data.voices.length === 0) throw new Error("NO_VOICES");
  return data.voices;
}

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
      "Use fun, playful vocabulary. Sentences can be medium length. Add little asides like \"Can you believe that?\" or \"Guess what happened next!\"",
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

export async function generateStory(anthropicKey, movieName, ageRange = "6-8") {
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

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [{ role: "user", content: storyPrompt }],
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || "Failed to generate story"
    );
  }
  const data = await res.json();
  const text = data.content.map((b) => b.text || "").join("\n");
  if (!text) throw new Error("No story generated");
  return text;
}

export async function generateAudioBase64(apiKey, voiceId, text) {
  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
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
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail?.message || "Failed to generate audio");
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // data:audio/mpeg;base64,<data> — strip the prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
