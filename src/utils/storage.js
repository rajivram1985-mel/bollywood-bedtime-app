import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// SecureStore has a 2048-byte value limit, so we use it only for API keys.
// Everything else (stories, voice selection) goes in AsyncStorage.

export const STORAGE_KEYS = {
  API_KEY: "elevenlabs-api-key",
  ANTHROPIC_KEY: "anthropic-api-key",
  VOICE_ID: "selected-voice-id",
  SAVED_STORIES: "saved-stories",
  AGE_RANGE: "age-range",
};

// --- Secure storage (API keys) ---

export async function getSecure(key) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecure(key, value) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // silently fail
  }
}

// --- Async storage (general data) ---

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
