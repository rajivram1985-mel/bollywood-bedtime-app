import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Pulsing bar while speaking
function PulseBar({ delay, isPlaying }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      height.value = withRepeat(
        withSequence(
          withTiming(20 + Math.random() * 14, { duration: 280 + delay }),
          withTiming(4, { duration: 280 + delay })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isPlaying]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

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

export default function SpeechPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Sleep timer
  const [timerMins, setTimerMins] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const elapsedRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const fadeIntervalRef = useRef(null);

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
      Speech.stop();
      clearInterval(elapsedRef.current);
      clearInterval(timerIntervalRef.current);
      clearInterval(fadeIntervalRef.current);
    };
  }, [text]);

  const startSpeaking = () => {
    Speech.speak(text, {
      rate: 0.85,
      pitch: 0.95,
      language: "en-IN",
      onStart: () => setIsPlaying(true),
      onDone: () => { setIsPlaying(false); setElapsed(0); },
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const togglePlay = async () => {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.stop();
      setIsPlaying(false);
    } else {
      setElapsed(0);
      startSpeaking();
    }
  };

  // Sleep timer fade-out — for speech we just stop after a brief pause
  const startFadeOut = () => {
    setIsFading(true);
    let steps = 0;
    fadeIntervalRef.current = setInterval(() => {
      steps++;
      if (steps >= 10) {
        clearInterval(fadeIntervalRef.current);
        Speech.stop();
        setIsPlaying(false);
        setIsFading(false);
        setTimerMins(null);
        setTimeLeft(0);
      }
    }, 500); // 5-second fade out (10 × 500ms)
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
            <Text style={styles.deviceLabel}>🔊 Device voice</Text>
            <Text style={styles.elapsedText}>
              {isPlaying ? formatTime(elapsed) : elapsed > 0 ? `${formatTime(elapsed)} paused` : ""}
            </Text>
          </View>
          <WaveVisualiser isPlaying={isPlaying} />
        </View>
      </View>

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

  // Sleep timer — identical to AudioPlayer
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
