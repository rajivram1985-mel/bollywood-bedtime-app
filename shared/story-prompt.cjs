// Single source of truth for the bedtime-story prompt.
// Used by the build-time generator (scripts/generate-stories.js) and the
// runtime Netlify Function (netlify/functions/generate-story.mjs) so bundled
// and on-demand stories always share the same tone and safety rules.

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

const AGE_KEYS = Object.keys(AGE_CONFIG);
const DEFAULT_AGE = "6-8";

function buildStoryPrompt(movieName, ageRange) {
  const age = AGE_CONFIG[ageRange] || AGE_CONFIG[DEFAULT_AGE];
  return (
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
    `Write the bedtime story now:`
  );
}

module.exports = { AGE_CONFIG, AGE_KEYS, DEFAULT_AGE, buildStoryPrompt };
