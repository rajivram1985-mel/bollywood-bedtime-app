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

// Story languages. "en-hi" is a bridge for kids who don't yet follow a whole
// story in Hindi: English, with everyday Hindi words woven in.
const LANGUAGE_CONFIG = {
  en: { label: "English" },
  "en-hi": {
    label: "English with Hindi words",
    rules: [
      "Write in English, but naturally weave in 10-15 everyday Hindi words and short phrases that Indian families use with children — for example beta, chalo, accha, dost, bahut, khush, shabash, nani, dadi, ghar, chanda mama, so jao",
      "Write the Hindi words in Roman letters (e.g. \"chalo\"), never in Devanagari",
      "Make each Hindi word's meaning obvious from context the first time it appears — sometimes by gently pairing it with English (\"his dost, his very best friend\")",
      "Repeat a few of the Hindi words more than once so they stick, but it must still read as an English story",
    ],
  },
  hi: {
    label: "Hindi",
    // Hindi needs a few more words than English for the same listening time.
    wordScale: 1.15,
    openings: {
      "3-5": "चलो बेटा, आँखें बंद करो और आराम से लेट जाओ...",
      "6-8": "चलो, रज़ाई ओढ़ लो और आराम से लेट जाओ...",
      "9-12": "चलो, आराम से लेट जाओ और आज की कहानी सुनो...",
    },
    rules: [
      "Write the whole story in Hindi, in Devanagari script",
      "Use simple, warm, everyday spoken Hindi — the way a parent or nani talks to a child at bedtime, and the way people talk in Hindi films. Prefer common words over formal or Sanskritised ones (\"दोस्त\" not \"मित्र\", \"ख़ुश\" not \"प्रसन्न\", \"सपना\" not \"स्वप्न\")",
      "The listener could be a boy or a girl: address them as \"बेटा\" or not at all, and avoid verb forms that assume their gender (say \"आँखें भारी हो रही हैं\", not \"थक गया\" or \"थक गई\")",
      "The narrator's voice may be a man's or a woman's, so avoid first-person verbs that reveal the narrator's gender (\"मैं सुनाता/सुनाती हूँ\") — prefer \"सुनो\", \"देखो\", \"पता है?\"",
      "Keep the characters' names as they are in the film",
      "End sentences with the Hindi full stop (।) and finish with a gentle \"शुभ रात्रि\"",
    ],
  },
};

const LANGUAGE_KEYS = Object.keys(LANGUAGE_CONFIG);
const DEFAULT_LANGUAGE = "en";

function scaleWordCount(wordCount, scale) {
  if (!scale) return wordCount;
  const n = Number(wordCount.replace(/[^0-9]/g, ""));
  return `~${Math.round((n * scale) / 50) * 50}`;
}

function buildStoryPrompt(movieName, ageRange, language = DEFAULT_LANGUAGE) {
  const age = AGE_CONFIG[ageRange] || AGE_CONFIG[DEFAULT_AGE];
  const lang = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG[DEFAULT_LANGUAGE];
  const ageKey = AGE_CONFIG[ageRange] ? ageRange : DEFAULT_AGE;
  const opening = lang.openings?.[ageKey] ?? age.opening;
  const languageRules = (lang.rules || []).map((r) => `- ${r}\n`).join("");
  return (
    `You are a warm, loving parent telling a bedtime story to ${age.audience} based on the Bollywood movie "${movieName}".\n\n` +
    `RULES:\n` +
    `- Rewrite the movie's plot as a cozy, fun bedtime story (${scaleWordCount(age.wordCount, lang.wordScale)} words)\n` +
    `- Use a casual, conversational tone as if a parent is reading to kids snuggled in bed\n` +
    `- ${age.complexity}\n` +
    `- Turn any romantic/sexual subplots into friendship stories\n` +
    `- Make all villains silly and cartoonish — bumbling, funny, not scary\n` +
    `- Remove any violence, replace with funny or clever solutions\n` +
    `- Keep the core adventure and emotional beats of the movie\n` +
    `- Start with "${opening}" or something similar\n` +
    `- End with a gentle, sleepy conclusion that helps kids drift off to sleep\n` +
    `- Do NOT include any stage directions, narrator labels, or formatting — just the story text as spoken words\n` +
    languageRules +
    `\nWrite the bedtime story now:`
  );
}

module.exports = {
  AGE_CONFIG,
  AGE_KEYS,
  DEFAULT_AGE,
  LANGUAGE_CONFIG,
  LANGUAGE_KEYS,
  DEFAULT_LANGUAGE,
  buildStoryPrompt,
};
