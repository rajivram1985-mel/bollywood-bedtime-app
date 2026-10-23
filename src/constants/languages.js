// Story languages. Must match LANGUAGE_CONFIG keys in shared/story-prompt.cjs.
// "en-hi" is the bridge level: an English story with everyday Hindi words.
export const STORY_LANGUAGES = [
  { key: "en", label: "English", short: "English", description: "Stories in English" },
  { key: "en-hi", label: "English with Hindi words", short: "Eng + Hindi", description: "English, sprinkled with everyday Hindi words" },
  { key: "hi", label: "Hindi", short: "हिन्दी", description: "The whole story in Hindi" },
];

export const LANGUAGE_KEYS = STORY_LANGUAGES.map((l) => l.key);
export const DEFAULT_LANGUAGE = "en";

export function languageLabel(key) {
  return STORY_LANGUAGES.find((l) => l.key === key)?.label ?? "English";
}
