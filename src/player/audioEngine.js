import { Platform } from "react-native";
import { Asset } from "expo-asset";
import { createAudioPlayer } from "expo-audio";

// Recorded narration (bundled .m4a) via expo-audio. Same interface as
// speechEngine so the player UI doesn't care which one it's driving.
//
// The player registers with the OS lock screen / Control Centre / Android
// media notification, so a parent can pause from a locked phone at bedtime.
// Lock-screen and background behaviour must be checked on a real device —
// it can't be exercised on web.

function artworkUri(illustration) {
  if (!illustration) return undefined;
  try {
    // Works on iOS, Android and web (Image.resolveAssetSource doesn't on web).
    // Web bundles a required image as { uri, width, height }; native as a number.
    const uri = typeof illustration === "object" ? illustration.uri : Asset.fromModule(illustration).uri;
    // Media Session needs an absolute URL; bundled web assets are relative.
    return Platform.OS === "web" && uri && !/^https?:/.test(uri) ? new URL(uri, window.location.href).href : uri;
  } catch {
    return undefined;
  }
}

// expo-audio's lock-screen API is a no-op on web; browsers have their own
// Media Session API, which phones show on the lock screen for web audio.
function setWebMediaSession(meta, player) {
  if (Platform.OS !== "web" || typeof navigator === "undefined" || !navigator.mediaSession) return;
  try {
    const art = artworkUri(meta.illustration);
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: meta.title || "Bedtime story",
      artist: "Bollywood Bedtime",
      album: meta.subtitle || "",
      artwork: art ? [{ src: art, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    const skip = (d) => () => player && player.seekTo(Math.max(0, (player.currentTime || 0) + d));
    navigator.mediaSession.setActionHandler("play", () => player?.play());
    navigator.mediaSession.setActionHandler("pause", () => player?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", skip(15));
  } catch {}
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
      setWebMediaSession(meta, player);
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
