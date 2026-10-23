import { Image } from "react-native";
import { createAudioPlayer } from "expo-audio";

// Recorded narration (bundled .m4a) via expo-audio. Same interface as
// speechEngine so the player UI doesn't care which one it's driving.
//
// The player registers with the OS lock screen / Control Centre / Android
// media notification, so a parent can pause from a locked phone at bedtime.
// Lock-screen and background behaviour must be checked on a real device —
// it can't be exercised on web.

function artworkUri(illustration) {
  try {
    return illustration ? Image.resolveAssetSource(illustration)?.uri : undefined;
  } catch {
    return undefined;
  }
}

export function createAudioEngine({ onStatus }) {
  let player = null;
  let subscription = null;

  const release = () => {
    subscription?.remove();
    subscription = null;
    if (player) {
      try {
        player.clearLockScreenControls?.();
      } catch {}
      try {
        player.remove();
      } catch {}
    }
    player = null;
  };

  return {
    kind: "audio",

    async load(source, _language, meta = {}) {
      release();
      player = createAudioPlayer(source, { updateInterval: 500 });
      subscription = player.addListener("playbackStatusUpdate", (s) => {
        onStatus({
          isPlaying: s.playing,
          positionSec: s.currentTime,
          durationSec: s.duration || undefined,
          didJustFinish: s.didJustFinish,
        });
      });
      try {
        player.setActiveForLockScreen?.(
          true,
          {
            title: meta.title,
            artist: "Bollywood Bedtime",
            albumTitle: meta.subtitle,
            artworkUrl: artworkUri(meta.illustration),
          },
          { showSeekBackward: true, showSeekForward: true }
        );
      } catch {
        // Lock-screen controls are a nicety; playback works without them.
      }
    },

    play: async () => {
      player?.play();
    },
    pause: async () => {
      player?.pause();
    },
    seekTo: async (sec) => {
      await player?.seekTo(Math.max(0, sec));
    },

    async unload() {
      release();
    },
  };
}
