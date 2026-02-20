import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function StoryLoader({ stage }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={pulseStyle}>
        <LinearGradient
          colors={[colors.gold, colors.orange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.circle}
        >
          <Text style={styles.emoji}>
            {stage === "story" ? "\u270d\ufe0f" : "\ud83d\udd0a"}
          </Text>
        </LinearGradient>
      </Animated.View>
      <Text style={styles.title}>
        {stage === "story"
          ? "Writing your bedtime story..."
          : "Creating the audio narration..."}
      </Text>
      <Text style={styles.subtitle}>
        {stage === "story"
          ? "Turning Bollywood magic into sleepy-time adventures"
          : "This may take a minute for a full story"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
