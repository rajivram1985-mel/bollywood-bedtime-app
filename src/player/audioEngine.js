import { Audio } from "expo-av";

// Recorded narration (bundled .m4a). Same interface as speechEngine so the
// player UI doesn't care which one it's driving. When migrating to
// expo-audio (expo-av is removed in SDK 55), only this file changes.

export function createAudioEngine({ onStatus }) {
  let sound = null;
  let loadToken = 0;

  const handleStatus = (s) => {
    if (!s.isLoaded) {
      if (s.error) onStatus({ error: s.error, isPlaying: false });
      return;
    }
    onStatus({
      isPlaying: s.isPlaying,
      positionSec: s.positionMillis / 1000,
      durationSec: s.durationMillis ? s.durationMillis / 1000 : undefined,
      didJustFinish: s.didJustFinish,
    });
  };

  const unloadSound = async () => {
    const s = sound;
    sound = null;
    if (s) await s.unloadAsync().catch(() => {});
  };

  return {
    kind: "audio",

    async load(source) {
      const myToken = ++loadToken;
      await unloadSound();
      const { sound: s } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false, progressUpdateIntervalMillis: 500 },
        handleStatus
      );
      if (myToken !== loadToken) {
        s.unloadAsync().catch(() => {});
        return;
      }
      sound = s;
    },

    play: async () => {
      await sound?.playAsync();
    },
    pause: async () => {
      await sound?.pauseAsync();
    },
    seekTo: async (sec) => {
      await sound?.setPositionAsync(Math.max(0, sec) * 1000);
    },

    async unload() {
      loadToken++;
      await unloadSound();
    },
  };
}
