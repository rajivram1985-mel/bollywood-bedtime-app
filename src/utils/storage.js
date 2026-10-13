import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  // Current
  KIDS: "kids-v1",
  ACTIVE_KID: "active-kid-v1",
  PREFS: "prefs-v1",
  PLAY_HISTORY: "play-history-v1",
  GENERATED_STORIES: "generated-stories",
  // Legacy (read once for migration)
  AGE_RANGE: "age-range",
  ONBOARDING_DONE: "onboarding-done",
};

export async function getData(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setData(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // silently fail
  }
}

export async function getJSON(key, fallback) {
  const raw = await getData(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  return setData(key, JSON.stringify(value));
}
