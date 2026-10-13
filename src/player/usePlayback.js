import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioEngine } from "./audioEngine";
import { createSpeechEngine } from "./speechEngine";

const idle = (story) => ({
  isPlaying: false,
  isLoading: !!story,
  positionSec: 0,
  durationSec: story?.minutes ? story.minutes * 60 : 0,
  error: null,
});

// Drives one story at a time through the right engine. `onFinish` fires once
// when the story plays to the end (not on pause/close).
export function usePlayback(story, { autoPlay = true, onFinish } = {}) {
  const [status, setStatus] = useState(() => idle(story));
  const engineRef = useRef(null);
  const statusRef = useRef(status);
  const onFinishRef = useRef(onFinish);
  statusRef.current = status;
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!story) {
      setStatus(idle(null));
      return;
    }
    let cancelled = false;

    const handle = (s) => {
      if (cancelled) return;
      setStatus((prev) => ({
        ...prev,
        isPlaying: s.isPlaying ?? prev.isPlaying,
        positionSec: s.positionSec ?? prev.positionSec,
        durationSec: s.durationSec || prev.durationSec,
        error: s.error ? "This story couldn't play. Try again in a moment." : prev.error,
      }));
      if (s.didJustFinish) onFinishRef.current?.();
    };

    const engine = story.audio ? createAudioEngine({ onStatus: handle }) : createSpeechEngine({ onStatus: handle });
    engineRef.current = engine;
    setStatus(idle(story));

    (async () => {
      try {
        await engine.load(story.audio || story.text);
        if (cancelled) return;
        setStatus((p) => ({ ...p, isLoading: false }));
        if (autoPlay) await engine.play();
      } catch (e) {
        if (!cancelled) {
          setStatus((p) => ({
            ...p,
            isLoading: false,
            error: e?.message?.includes("supported")
              ? "Your browser can't read stories aloud. Try Chrome, Edge or Safari."
              : "This story couldn't play. Try again in a moment.",
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      engine.unload();
      if (engineRef.current === engine) engineRef.current = null;
    };
    // Re-run only when the story itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const play = useCallback(() => engineRef.current?.play(), []);
  const pause = useCallback(() => engineRef.current?.pause(), []);
  const toggle = useCallback(() => (statusRef.current.isPlaying ? pause() : play()), [play, pause]);
  const seekTo = useCallback((sec) => {
    const d = statusRef.current.durationSec || 0;
    const clamped = Math.min(Math.max(0, sec), Math.max(0, d - 1));
    setStatus((p) => ({ ...p, positionSec: clamped }));
    return engineRef.current?.seekTo(clamped);
  }, []);
  const seekBy = useCallback((delta) => seekTo((statusRef.current.positionSec || 0) + delta), [seekTo]);

  return { ...status, play, pause, toggle, seekTo, seekBy };
}
