# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start Expo dev server (then press `w` for web, `a` for Android, `i` for iOS, or scan QR with Expo Go).
- `npm run web` / `npm run android` / `npm run ios` — start with a target platform pre-selected.
- `node scripts/generate-stories.js [--langs=en,en-hi,hi] [--ages=3-5,9-12] [--films=ddlj,sholay] [--audio] [--dry-run]` — write any missing bundled story text with Claude (and, with `--audio`, ElevenLabs narration). Idempotent: skips film×age×language combinations that already exist. Defaults to English only. `--dry-run` prints what would run plus the ElevenLabs character count (that's the paid part).
- `node scripts/optimize-audio.js` — re-encode raw ElevenLabs `.mp3` in `assets/audio/` to 56 kbps mono AAC `.m4a` (~55% smaller), delete the mp3, regenerate the audio manifest. Run after any `--audio` generation.
- `node scripts/build-images.js` — convert any `assets/illustrations/*.png` to JPEG and re-render the app icon / adaptive icon / splash / favicon from the vector brand mark defined in the script (source SVG also written to `assets/brand/icon.svg`).

There is no test runner or linter. `npx expo export --platform web` is the closest thing to a build check (it's what Netlify runs).

## Environment variables

Three scopes (see [.env.example](.env.example)):

- **Build-time scripts** (Node, not bundled): `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` (a secret key starting `sk_`, not the dashboard key ID), `ELEVENLABS_VOICE_ID`, and optional per-language voices `ELEVENLABS_VOICE_ID_HI` / `ELEVENLABS_VOICE_ID_EN_HI` (an English-accent voice reading Hindi sounds foreign).
- **Runtime client** (`EXPO_PUBLIC_*` are inlined into the app bundle and visible to anyone): `EXPO_PUBLIC_TMDB_API_KEY` only.
- **Netlify Function** (server-side, set in Netlify dashboard): `ANTHROPIC_API_KEY` — read by [netlify/functions/generate-story.mjs](netlify/functions/generate-story.mjs). Never expose this client-side.

## Architecture

**Expo app, universal (iOS/Android/web), no navigation library.** [App.js](App.js) wraps everything in `SafeAreaProvider` + `ProfileProvider`, and renders `OnboardingScreen` until at least one child profile exists, then `HomeScreen`. The player (`NowPlayingScreen`) and `SettingsSheet` are `Modal`s owned by `HomeScreen`.

### Content model: film × age × language

Every bundled film has up to three age versions — `3-5` (~1000 words, ~7 min), `6-8` (~1800, ~12 min), `9-12` (~2500, ~17 min) — in up to three languages: `en`, `en-hi` (English with everyday Hindi words, a bridge for kids still learning Hindi) and `hi` (Hindi, Devanagari). Hindi currently exists for 3-5 only.

- [src/data/films.js](src/data/films.js) — **hand-maintained**: id, title, year, collection, tagline, illustration. `COLLECTIONS` drives the home-screen rows.
- [src/data/stories/](src/data/stories/)`<lang>.json` — **generated**: `{ [filmId]: { [age]: text } }`. Non-English text must be reviewed by a native speaker before narration is generated.
- [src/data/storyAudio.js](src/data/storyAudio.js) — **generated** by [scripts/lib/audio-manifest.js](scripts/lib/audio-manifest.js) from files named `assets/audio/<filmId>-<age>[-<lang>].m4a` (English has no suffix). Shape: `STORY_AUDIO[lang][filmId][age]`. Metro can only bundle literal `require()`s, hence the generated file.
- [src/data/catalog.js](src/data/catalog.js) joins the three into story objects. `getFilmStory(film, age, language)` falls back to the nearest available age in that language (preferring younger), and to English if the film has nothing in that language. A story has `audio` (narrated) or not (device TTS).

To add a film: add it to `FILMS` in both `src/data/films.js` and `scripts/generate-stories.js`, add an illustration, then run the generator.

### Story prompt — single source

[shared/story-prompt.cjs](shared/story-prompt.cjs) holds `AGE_CONFIG`, `LANGUAGE_CONFIG` and `buildStoryPrompt(movie, age, language)`. Hindi rules ask for everyday spoken Hindi (not Sanskritised), and avoid gendered verb forms for both listener and narrator since either could be a boy/girl or man/woman. The English prompt is unchanged from before languages existed. Used by the generator script and imported by the Netlify Function (which prepends its `NOT_A_FILM` validation). Model everywhere: `claude-sonnet-4-6`.

### Profiles and preferences

[src/state/ProfileContext.js](src/state/ProfileContext.js) — local-only family state: `kids [{id, name, ageRange, language}]`, active kid, prefs (`storiesPerNight`), and play history (feeds the "tonight's pick" rotation so the hero doesn't repeat recently heard stories). It migrates pre-profile installs (legacy `age-range` key → one unnamed child).

### Playback

[src/player/usePlayback.js](src/player/usePlayback.js) drives one story through one of two engines with the same interface (`load/play/pause/seekTo/unload`, status callbacks):

- [audioEngine.js](src/player/audioEngine.js) — bundled `.m4a` via `expo-audio` (`createAudioPlayer`). Registers lock-screen / Control Centre / Android media controls with title and artwork (no-op on web). `expo-audio` declares `expo-asset` as an open peer dependency — keep `expo-asset` pinned to the SDK's version as a direct dependency or npm pulls a newer SDK's build and Metro fails on `expo/internal/bundle-origin`.
- [speechEngine.js](src/player/speechEngine.js) — device TTS via `expo-speech` / `window.speechSynthesis`. Text is spoken in ~220-char sentence chunks because Android TTS rejects input over 4000 chars and Chromium cuts long utterances off. Position/duration are estimated from characters; seeking snaps to chunk boundaries but always moves at least one chunk. Splits on । as well as . ! ?. Voice choice is per language: en-IN first for English, hi-IN only for Hindi — on web, a Hindi story with no Hindi voice installed fails with `NoVoiceError` and a read-along hint rather than mangling Devanagari with an English voice.

[NowPlayingScreen](src/screens/NowPlayingScreen.js) owns the bedtime session: a queue (tapped story first, then the rest of the catalogue), "stories tonight" count (1–3) instead of a minutes timer, auto-advance, a goodnight screen when done, read-along text, and dim mode (manual, plus automatic after 45 s idle while playing).

iOS background audio is enabled via `UIBackgroundModes: ["audio"]` in [app.json](app.json) plus `setAudioModeAsync({ shouldPlayInBackground: true, playsInSilentMode: true, interruptionMode: "doNotMix" })` in [App.js](App.js). The `expo-audio` plugin is configured with `microphonePermission: false` and Android blocks `RECORD_AUDIO` — the app must never ask for the mic. Background and lock-screen behaviour (both engines) has not been verified on a device.

### Story generation is server-side

The client ([src/utils/api.js](src/utils/api.js)) posts `{ movieName, ageRange, language }` to `${EXPO_PUBLIC_API_BASE_URL}/.netlify/functions/generate-story` and reads Anthropic's SSE stream. On web the base URL is empty (same origin). On native it must point at the deployed site; `expo/fetch` provides the streaming body that RN's built-in fetch lacks, and a hand-rolled streaming UTF-8 decoder covers Hermes builds without `TextDecoder`. If the env var is unset on native, the "make a story" section is hidden (`canGenerateStories`). For local dev run `netlify dev` (port 8888); plain `npm run web` 404s on the function. Generated stories are saved under "Made by you" and always use device TTS.

The function validates the title against a plain-title character class (no quotes/brackets/newlines, ≤60 chars) because it's embedded in the prompt, whitelists age and language, and applies a best-effort per-IP limit (12/hour per warm instance — not a real quota; a durable per-device quota needs shared storage such as Netlify Blobs).

### Store readiness

[eas.json](eas.json) has `preview` (internal, Android APK) and `production` profiles. Still missing before a store build: `ios.bundleIdentifier` / `android.package` (a permanent identity — the owner's decision), the contact email in [public/privacy.html](public/privacy.html) (a draft written from what the code does; update it whenever data handling changes), and `EXPO_PUBLIC_API_BASE_URL` for the build.

### Storage

[src/utils/storage.js](src/utils/storage.js) — AsyncStorage helpers (`getData/setData/getJSON/setJSON`) and the `STORAGE_KEYS` registry. Everything is device-local.

### Web gotcha: images

React Native Web sizes a `require()`d image to its intrinsic pixels unless the style sets width/height explicitly — `absoluteFill` alone isn't enough. Use [StoryArt](src/components/StoryArt.js), which sets `width/height: "100%"`.

### Design system ("Jharokha nights")

- **Motif:** story artwork always sits in [ArchFrame](src/components/ArchFrame.js) — an arched palace window (radius = half the width) with a thin marigold inset border. Pass `width` when known; otherwise it measures itself. Section marks come from [Ornament](src/components/Ornament.js) (`Phool`, `Divider`).
- **Palette** ([src/constants/colors.js](src/constants/colors.js)): indigo `night*` surfaces, solid `marigold` for anything tappable (no gradient buttons), `cream` text instead of pure white, opaque `card`/`cardRaised` surfaces. Older names (`gold`, `goldLight`, `white`…) are aliases onto the new palette.
- **Type:** Baloo 2 for headings (it has matching Devanagari, Tamil, Bengali and Telugu families for future languages), Nunito for body. Hindi read-along falls back to the system Devanagari font.
- **No emoji in UI chrome** — draw icons in [Icons.js](src/components/Icons.js) so every platform looks the same.
