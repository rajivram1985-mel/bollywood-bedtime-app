import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import Svg, { Rect, Path } from "react-native-svg";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

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
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      soundRef.current = newSound;
      sound = newSound;
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  // Update the callback on the existing sound when isSliding changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }
  }, [onPlaybackStatusUpdate]);

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
    if (isSliding) {
      setCurrentTime(value);
    }
  };

  if (!audioUri) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={togglePlay}>
          <LinearGradient
            colors={[colors.gold, colors.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButton}
          >
            {isPlaying ? (
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="white">
                <Rect x={4} y={2} width={4} height={16} rx={1} fill="white" />
                <Rect x={12} y={2} width={4} height={16} rx={1} fill="white" />
              </Svg>
            ) : (
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="white">
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
  },
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
});
