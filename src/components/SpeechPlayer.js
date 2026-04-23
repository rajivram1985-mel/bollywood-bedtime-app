import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import Svg, { Rect, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const TIMER_OPTIONS = [15, 30, 45, 60];
const IS_WEB = Platform.OS === "web";

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Web TTS engine ──────────────────────────────────────────────────────────
//
// `expo-speech` on web wraps `window.speechSynthesis`, but Chromium-based
// browsers cut audio off after ~15 seconds for a single utterance. Our
// stories are several thousand words long, so they would silently die.
//
// To make the player actually work in the browser, we run our own engine
// that splits the story into short sentences and queues them one at a time.
// We also pre-warm the voice list (some browsers populate voices async).
//
function createWebEngine() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const synth = window.speechSynthesis;
  let chunks = [];
  let index = 0;
  let onDone = () => {};
  let onChunk = () => {};
  let cancelled = false;
  let voicesReady = false;

  // Some browsers load voices asynchronously
  const ensureVoices = () =>
    new Promise((resolve) => {
      const v = synth.getVoices();
      if (v && v.length) { voicesReady = true; resolve(v); return; }
      const onChange = () => {
        const vs = synth.getVoices();
        if (vs && vs.length) {
          voicesReady = true;
          synth.removeEventListener("voiceschanged", onChange);
          resolve(vs);
        }
      };
      synth.addEventListener("voiceschanged", onChange);
      // Hard cap so we never hang
      setTimeout(() => { resolve(synth.getVoices() || []); }, 1500);
    });

  // Prefer a soft, clear English voice
  const pickVoice = (voices) => {
    if (!voices || !voices.length) return null;
    const prefs = [
      (v) => v.lang === "en-IN",
      (v) => v.lang?.startsWith("en-GB"),
      (v) => v.lang?.startsWith("en-AU"),
      (v) => v.lang?.startsWith("en"),
    ];
    for (const pref of prefs) {
      const match = voices.find(pref);
      if (match) return match;
    }
    return voices[0];
  };

  const splitIntoChunks = (text) => {
    // Split on sentence boundaries; keep chunks small enough that Chrome
    // doesn't truncate them mid-utterance.
    const sentences = text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
    const out = [];
    let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > 180) {
        if (buf) out.push(buf.trim());
        buf = s;
      } else {
        buf = (buf + " " + s).trim();
      }
    }
    if (buf) out.push(buf.trim());
    return out;
  };

  const speakNext = (voice) => {
    if (cancelled) return;
    if (index >= chunks.length) { onDone(); return; }
    const u = new SpeechSynthesisUtterance(chunks[index]);
    if (voice) u.voice = voice;
    u.rate = 0.85;     // a touch faster than expo's 0.78 for less robotic feel
    u.pitch = 0.95;
    u.lang = voice?.lang || "en-US";
    u.onend = () => {
      index++;
      onChunk(index, chunks.length);
      if (!cancelled) speakNext(voice);
    };
    u.onerror = () => {
      // Skip past failed chunks rather than stalling
      index++;
      if (!cancelled) speakNext(voice);
    };
    synth.speak(u);
  };

  return {
    isAvailable: true,
    voicesReady,
    async start({ text, onChunkProgress, onComplete }) {
      cancelled = false;
      synth.cancel();
      chunks = splitIntoChunks(text);
      index = 0;
      onDone = onComplete || (() => {});
      onChunk = onChunkProgress || (() => {});
      const voices = await ensureVoices();
      const voice = pickVoice(voices);
      speakNext(voice);
    },
    stop() {
      cancelled = true;
      try { synth.cancel(); } catch {}
    },
  };
}

// ─── Animated wave bars ─────────────────────────────────────────────────────

function PulseBar({ delay, isPlaying }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      height.value = withRepeat(
        withSequence(
          withTiming(20 + Math.random() * 14, { duration: 280 + delay }),
          withTiming(4,                        { duration: 280 + delay })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isPlaying]);

  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[styles.pulseBar, style]} />;
}

function WaveVisualiser({ isPlaying }) {
  return (
    <View style={styles.waveRow}>
      {Array.from({ length: 18 }).map((_, i) => (
        <PulseBar key={i} delay={i * 30} isPlaying={isPlaying} />
      ))}
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SpeechPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const [errorMsg, setErrorMsg]   = useState(null);

  // Sleep timer
  const [timerMins, setTimerMins]   = useState(null);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [isFading, setIsFading]     = useState(false);

  const elapsedRef       = useRef(null);
  const timerIntervalRef = useRef(null);
  const fadeIntervalRef  = useRef(null);
  const webEngineRef     = useRef(null);

  // Lazily build the web engine once
  if (IS_WEB && !webEngineRef.current) {
    webEngineRef.current = createWebEngine();
  }

  // Elapsed counter
  useEffect(() => {
    if (isPlaying) {
      elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [isPlaying]);

  // Cleanup on unmount / text change
  useEffect(() => {
    return () => {
      stopAll();
      clearInterval(elapsedRef.current);
      clearInterval(timerIntervalRef.current);
      clearInterval(fadeIntervalRef.current);
    };
  }, [text]);

  const stopAll = () => {
    if (IS_WEB) {
      webEngineRef.current?.stop();
    } else {
      try { Speech.stop(); } catch {}
    }
  };

  const startSpeaking = async () => {
    setErrorMsg(null);

    if (IS_WEB) {
      const engine = webEngineRef.current;
      if (!engine) {
        setErrorMsg("Sorry — your browser doesn't support speech playback. Try Chrome, Edge or Safari.");
        return;
      }
      setIsPlaying(true);
      try {
        await engine.start({
          text,
          onComplete: () => { setIsPlaying(false); setElapsed(0); },
        });
      } catch (e) {
        setIsPlaying(false);
        setErrorMsg("Couldn't start the storyteller. Try tapping play again.");
      }
      return;
    }

    // Native (iOS / Android) — use expo-speech directly
    Speech.speak(text, {
      rate:      0.78,
      pitch:     0.90,
      language:  "en-US",
      onStart:   () => setIsPlaying(true),
      onDone:    () => { setIsPlaying(false); setElapsed(0); },
      onStopped: () => setIsPlaying(false),
      onError:   () => {
        setIsPlaying(false);
        setErrorMsg("Couldn't play audio on this device.");
      },
    });
  };

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        stopAll();
        setIsPlaying(false);
        return;
      }
      // On native, also check the engine state in case a previous play is queued
      if (!IS_WEB) {
        const speaking = await Speech.isSpeakingAsync().catch(() => false);
        if (speaking) {
          Speech.stop();
          setIsPlaying(false);
          return;
        }
      }
      setElapsed(0);
      startSpeaking();
    } catch {
      setElapsed(0);
      startSpeaking();
    }
  };

  // Sleep timer — fade out after countdown
  const startFadeOut = () => {
    setIsFading(true);
    let steps = 0;
    fadeIntervalRef.current = setInterval(() => {
      steps++;
      if (steps >= 10) {
        clearInterval(fadeIntervalRef.current);
        stopAll();
        setIsPlaying(false);
        setIsFading(false);
        setTimerMins(null);
        setTimeLeft(0);
      }
    }, 500);
  };

  const activateTimer = (mins) => {
    clearInterval(timerIntervalRef.current);
    clearInterval(fadeIntervalRef.current);
    setIsFading(false);

    if (mins === null) {
      setTimerMins(null);
      setTimeLeft(0);
      return;
    }

    setTimerMins(mins);
    setTimeLeft(mins * 60);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          startFadeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const timerLabel = isFading
    ? "🌙 Fading out…"
    : timerMins
    ? `⏳ ${formatTime(timeLeft)} remaining`
    : "🌙 Sleep timer";

  if (!text) return null;

  return (
    <View style={styles.container}>
      {/* Playback row */}
      <View style={styles.row}>
        <Pressable onPress={togglePlay}>
          <LinearGradient
            colors={[colors.gold, colors.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButton}
          >
            {isPlaying ? (
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Rect x={4} y={2} width={4} height={16} rx={1} fill="white" />
                <Rect x={12} y={2} width={4} height={16} rx={1} fill="white" />
              </Svg>
            ) : (
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Path d="M5 2l12 8-12 8V2z" fill="white" />
              </Svg>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.rightArea}>
          <View style={styles.statusRow}>
            <Text style={styles.deviceLabel}>🎙️ Storyteller</Text>
            <Text style={styles.elapsedText}>
              {isPlaying
                ? formatTime(elapsed)
                : elapsed > 0
                ? `${formatTime(elapsed)} paused`
                : ""}
            </Text>
          </View>
          <WaveVisualiser isPlaying={isPlaying} />
        </View>
      </View>

      {errorMsg ? (
        <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
      ) : null}

      {/* Sleep timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>{timerLabel}</Text>
        <View style={styles.timerOptions}>
          {TIMER_OPTIONS.map((mins) => {
            const active = timerMins === mins;
            return (
              <Pressable
                key={mins}
                onPress={() => activateTimer(active ? null : mins)}
                style={[styles.timerPill, active && styles.timerPillActive]}
              >
                <Text style={[styles.timerPillText, active && styles.timerPillTextActive]}>
                  {mins}m
                </Text>
              </Pressable>
            );
          })}
          {timerMins !== null && (
            <Pressable onPress={() => activateTimer(null)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 20, 50, 0.85)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderGold,
    gap: 16,
  },

  // Playback
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  rightArea: {
    flex: 1,
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textTertiary,
  },
  elapsedText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },

  // Wave visualiser
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 28,
  },
  pulseBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    opacity: 0.7,
  },

  // Error
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#ff9999",
    lineHeight: 18,
  },

  // Sleep timer
  timerSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderGoldFaint,
    gap: 10,
  },
  timerLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },
  timerOptions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  timerPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  timerPillActive: {
    backgroundColor: "rgba(246,166,35,0.18)",
    borderColor: colors.gold,
  },
  timerPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  timerPillTextActive: {
    color: colors.gold,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
