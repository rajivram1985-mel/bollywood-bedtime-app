# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start Expo dev server (then press `w` for web, `a` for Android, `i` for iOS, or scan QR with Expo Go).
- `npm run web` / `npm run android` / `npm run ios` — start with a target platform pre-selected.
- `node scripts/generate-prebuilt.js` — (re)generate text + ElevenLabs MP3 audio for the prebuilt movie list. Skips movies already present in [assets/audio/stories-cache.json](assets/audio/stories-cache.json).
- `node scripts/generate-text-only.js` — generate text-only stories (no audio); appended to `prebuiltStories.js` with `audio: null` so they fall back to `expo-speech`.
- `node scripts/patch-cache.js` — backfill `stories-cache.json` from existing entries in `prebuiltStories.js` (used after manual edits to avoid regenerating audio).

There is no test runner, linter, or build step configured beyond Expo's own bundler.

## Environment variables

Two scopes (see [.env.example](.env.example)):

- **Build-time scripts** (Node, not bundled): `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
- **Runtime client** (`EXPO_PUBLIC_*` are inlined into the app bundle): `EXPO_PUBLIC_ANTHROPIC_API_KEY` (used for on-demand story generation from the UI), `EXPO_PUBLIC_TMDB_API_KEY` (poster lookups).

The runtime Anthropic call sets `anthropic-dangerous-direct-browser-access: true` because Expo web runs in a browser context.

## Architecture

**Single-screen Expo app, universal (iOS/Android/web), no navigation library.** [App.js](App.js) reads `ONBOARDING_DONE` from AsyncStorage and conditionally renders `OnboardingScreen` or `HomeScreen`. Long-pressing the moon emoji on the home header re-triggers onboarding.

### Two narration paths

A story is either pre-bundled with audio or narrated on-device — the home screen picks the player based on whether `audioUri` is set:

- **`AudioPlayer`** ([src/components/AudioPlayer.js](src/components/AudioPlayer.js)) — plays bundled MP3s via `expo-av`. Includes a sleep timer that fades volume over 5 s before stopping. Used only for the original 5 prebuilt stories.
- **`SpeechPlayer`** ([src/components/SpeechPlayer.js](src/components/SpeechPlayer.js)) — uses on-device `expo-speech` TTS. Used for everything else (newer text-only prebuilts and user-generated stories), so they ship without audio assets. Its sleep timer just stops speech (no fade — TTS has no volume API).

iOS background audio is enabled via `UIBackgroundModes: ["audio"]` in [app.json](app.json) plus `Audio.setAudioModeAsync({ staysActiveInBackground: true, ... })` in [App.js](App.js).

### Prebuilt stories pipeline

[src/constants/prebuiltStories.js](src/constants/prebuiltStories.js) is **auto-generated** — do not edit manually. The `PREBUILT_STORIES` array contains `{ movieName, ageRange, text, audio }` entries; `audio` is either a `require("../../assets/audio/<file>.mp3")` (plays via `AudioPlayer`) or `null` (plays via `SpeechPlayer`).

[assets/audio/stories-cache.json](assets/audio/stories-cache.json) is the script's idempotency mechanism — if a movie is in the cache AND its `.mp3` exists, `generate-prebuilt.js` skips it. Delete cache entries to force regeneration.

### Story prompt is duplicated in three files

The `AGE_CONFIG` object and prompt template appear in [src/utils/api.js](src/utils/api.js), [scripts/generate-prebuilt.js](scripts/generate-prebuilt.js), and [scripts/generate-text-only.js](scripts/generate-text-only.js). Changing the prompt requires updating all three; otherwise runtime-generated and prebuilt stories drift in tone. Model used everywhere: `claude-sonnet-4-6`.

### Movie posters

[src/utils/tmdb.js](src/utils/tmdb.js) fetches posters from TMDB and caches the URL map in AsyncStorage under `tmdb-poster-cache-v1`. `MOVIE_METADATA` (search title + year + fallback emoji) lives in [src/components/FeaturedStories.js](src/components/FeaturedStories.js); `GENRE_SECTIONS` in the same file controls the tab structure ("Timeless Classics", "Heart & Drama", etc.). User-generated stories appear under a dynamic "My Stories" tab.

### Storage abstraction

[src/utils/storage.js](src/utils/storage.js) wraps two backends behind one `STORAGE_KEYS` registry: `expo-secure-store` (API keys, 2 KB value limit) and `AsyncStorage` (everything else — saved stories, age range, onboarding flag). Use the helpers, not the underlying APIs directly, so the SecureStore-vs-AsyncStorage decision stays in one place.

### Layout

[HomeScreen.js](src/screens/HomeScreen.js) switches between a 3-column layout (`WhySection` sidebars + center column) and a single-column layout at a 900 px width breakpoint via `useWindowDimensions`.

### Vestigial code

[src/config.js](src/config.js) exports `API_BASE_URL` pointing to a local `:3001` server, but nothing imports it — there is no backend in this repo. All external calls go directly from the client to Anthropic / ElevenLabs / TMDB.
