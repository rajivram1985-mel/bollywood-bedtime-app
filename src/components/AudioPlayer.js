import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import Svg, { Rect, Path } from "react-native-svg";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const TIMER_OPTIONS = [15, 30, 45, 60];
const FADE_STEPS = 50;
const FADE_INTERVAL_MS = 100; // 50 steps × 100 ms = 5 second fade

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ audioUri }) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  // Sleep timer
  const [timerMins, setTimerMins] = useState(null); // null = off
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const timerIntervalRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  const onPlaybackStatusUpdate = useCallback(
    (status) => {
      if (!status.isLoaded) return;
      if (!isSliding) {
        setCurrentTime(status.positionMillis / 1000);
      }
      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    },
    [isSliding]
  );

  useEffect(() => {
    let sound;
    (async () => {
      if (!audioUri) return;
      // Reset timer when the track changes
      clearInterval(timerIntervalRef.current);
      clearInterval(fadeIntervalRef.current);
      setTimerMins(null);
      setTimeLeft(0);
      setIsFading(false);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const source = typeof audioUri === "number" ? audioUri : { uri: audioUri };
      const { sound: newSound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      soundRef.current = newSound;
      sound = newSound;
    })();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [audioUri]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }
  }, [onPlaybackStatusUpdate]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const startFadeOut = useCallback(async () => {
    if (!soundRef.current) return;
    setIsFading(true);
    let step = 0;
    fadeIntervalRef.current = setInterval(async () => {
      step++;
      const vol = Math.max(0, 1 - step / FADE_STEPS);
      await soundRef.current?.setVolumeAsync(vol);
      if (step >= FADE_STEPS) {
        clearInterval(fadeIntervalRef.current);
        await soundRef.current?.pauseAsync();
        await soundRef.current?.setVolumeAsync(1.0);
        setIsPlaying(false);
        setIsFading(false);
        setTimerMins(null);
        setTimeLeft(0);
      }
    }, FADE_INTERVAL_MS);
  }, []);

  const activateTimer = (mins) => {
    clearInterval(timerIntervalRef.current);
    clearInterval(fadeIntervalRef.current);
    if (soundRef.current) soundRef.current.setVolumeAsync(1.0);
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

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const onSlidingStart = () => setIsSliding(true);

  const onSlidingComplete = async (value) => {
    setIsSliding(false);
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value * 1000);
    }
  };

  const onValueChange = (value) => {
    if (isSliding) setCurrentTime(value);
  };

  if (!audioUri) return null;

  const timerLabel = isFading
    ? "🌙 Fading out…"
    : timerMins
    ? `⏳ ${formatTime(timeLeft)} remaining`
    : "🌙 Sleep timer";

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
        <View style={styles.sliderArea}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingStart={onSlidingStart}
            onSlidingComplete={onSlidingComplete}
            onValueChange={onValueChange}
            minimumTrackTintColor={colors.gold}
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor={colors.gold}
          />
        </View>
      </View>

      {/* Sleep timer row */}
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
                <Text
                  style={[
                    styles.timerPillText,
                    active && styles.timerPillTextActive,
                  ]}
                >
                  {mins}m
                </Text>
              </Pressable>
            );
          })}
          {timerMins !== null && (
            <Pressable
              onPress={() => activateTimer(null)}
              style={styles.cancelBtn}
            >
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
  sliderArea: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 30,
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
