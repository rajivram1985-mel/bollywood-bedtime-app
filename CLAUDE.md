# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start Expo dev server (then press `w` for web, `a` for Android, `i` for iOS, or scan QR with Expo Go).
- `npm run web` / `npm run android` / `npm run ios` — start with a target platform pre-selected.
- `node scripts/generate-stories.js [--ages=3-5,9-12] [--films=ddlj,sholay] [--audio] [--dry-run]` — write any missing bundled story text with Claude (and, with `--audio`, ElevenLabs narration). Idempotent: skips film×age pairs that already exist. `--dry-run` prints what would run plus the ElevenLabs character count (that's the paid part).
- `node scripts/optimize-audio.js` — re-encode raw ElevenLabs `.mp3` in `assets/audio/` to 56 kbps mono AAC `.m4a` (~55% smaller), delete the mp3, regenerate the audio manifest. Run after any `--audio` generation.
- `node scripts/build-images.js` — convert any `assets/illustrations/*.png` to JPEG and re-render the app icon / adaptive icon / splash / favicon from the vector brand mark defined in the script (source SVG also written to `assets/brand/icon.svg`).

There is no test runner or linter. `npx expo export --platform web` is the closest thing to a build check (it's what Netlify runs).

## Environment variables

Three scopes (see [.env.example](.env.example)):

- **Build-time scripts** (Node, not bundled): `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`.
- **Runtime client** (`EXPO_PUBLIC_*` are inlined into the app bundle and visible to anyone): `EXPO_PUBLIC_TMDB_API_KEY` only.
- **Netlify Function** (server-side, set in Netlify dashboard): `ANTHROPIC_API_KEY` — read by [netlify/functions/generate-story.mjs](netlify/functions/generate-story.mjs). Never expose this client-side.

## Architecture

**Expo app, universal (iOS/Android/web), no navigation library.** [App.js](App.js) wraps everything in `SafeAreaProvider` + `ProfileProvider`, and renders `OnboardingScreen` until at least one child profile exists, then `HomeScreen`. The player (`NowPlayingScreen`) and `SettingsSheet` are `Modal`s owned by `HomeScreen`.

### Content model: film × age

Every bundled film has up to three versions — ages `3-5` (~1000 words, ~7 min), `6-8` (~1800, ~12 min), `9-12` (~2500, ~17 min).

- [src/data/films.js](src/data/films.js) — **hand-maintained**: id, title, year, collection, tagline, illustration. `COLLECTIONS` drives the home-screen rows.
- [src/data/storyTexts.json](src/data/storyTexts.json) — **generated**: `{ [filmId]: { [age]: text } }`.
- [src/data/storyAudio.js](src/data/storyAudio.js) — **generated** by [scripts/lib/audio-manifest.js](scripts/lib/audio-manifest.js) from files named `assets/audio/<filmId>-<age>.m4a`. Metro can only bundle literal `require()`s, hence the generated file.
- [src/data/catalog.js](src/data/catalog.js) joins the three into story objects. `getFilmStory(film, age)` falls back to the nearest available age (preferring younger) if a version is missing. A story has `audio` (narrated) or not (device TTS).

To add a film: add it to `FILMS` in both `src/data/films.js` and `scripts/generate-stories.js`, add an illustration, then run the generator.

### Story prompt — single source

[shared/story-prompt.cjs](shared/story-prompt.cjs) holds `AGE_CONFIG` and `buildStoryPrompt`. Used by the generator script and imported by the Netlify Function (which prepends its `NOT_A_FILM` validation). Model everywhere: `claude-sonnet-4-6`.

### Profiles and preferences

[src/state/ProfileContext.js](src/state/ProfileContext.js) — local-only family state: `kids [{id, name, ageRange}]`, active kid, prefs (`storiesPerNight`), and play history (feeds the "tonight's pick" rotation so the hero doesn't repeat recently heard stories). It migrates pre-profile installs (legacy `age-range` key → one unnamed child).

### Playback

[src/player/usePlayback.js](src/player/usePlayback.js) drives one story through one of two engines with the same interface (`load/play/pause/seekTo/unload`, status callbacks):

- [audioEngine.js](src/player/audioEngine.js) — bundled `.m4a` via `expo-av`. `expo-av` is removed in SDK 55; migrating to `expo-audio` should only touch this file.
- [speechEngine.js](src/player/speechEngine.js) — device TTS via `expo-speech` / `window.speechSynthesis`. Text is spoken in ~220-char sentence chunks because Android TTS rejects input over 4000 chars and Chromium cuts long utterances off. Position/duration are estimated from characters; seeking snaps to chunk boundaries but always moves at least one chunk. Prefers en-IN voices.

[NowPlayingScreen](src/screens/NowPlayingScreen.js) owns the bedtime session: a queue (tapped story first, then the rest of the catalogue), "stories tonight" count (1–3) instead of a minutes timer, auto-advance, a goodnight screen when done, read-along text, and dim mode (manual, plus automatic after 45 s idle while playing).

iOS background audio is enabled via `UIBackgroundModes: ["audio"]` in [app.json](app.json) plus `Audio.setAudioModeAsync({ staysActiveInBackground: true, ... })` in [App.js](App.js). Background behaviour of the chunked TTS path has not been verified on a device.

### Story generation is server-side (web only for now)

The client posts `{ movieName, ageRange }` to `/.netlify/functions/generate-story` and reads Anthropic's SSE stream. This only works on web: native has no origin for the relative URL and React Native's `fetch` has no streaming body. For local dev run `netlify dev` (port 8888); plain `npm run web` 404s on the function. Generated stories are saved under "Made by you" and always use device TTS.

### Storage

[src/utils/storage.js](src/utils/storage.js) — AsyncStorage helpers (`getData/setData/getJSON/setJSON`) and the `STORAGE_KEYS` registry. Everything is device-local.

### Web gotcha: images

React Native Web sizes a `require()`d image to its intrinsic pixels unless the style sets width/height explicitly — `absoluteFill` alone isn't enough. Use [StoryArt](src/components/StoryArt.js), which sets `width/height: "100%"`.
