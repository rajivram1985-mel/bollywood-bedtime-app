import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import NightSky from "../components/NightSky";
import AudioPlayer from "../components/AudioPlayer";
import FeaturedStories from "../components/FeaturedStories";
import WhySection from "../components/WhySection";

import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function HomeScreen({ onResetOnboarding }) {
  const [currentStory, setCurrentStory] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [showStoryText, setShowStoryText] = useState(false);

  const loadPrebuiltStory = useCallback((story) => {
    setCurrentStory({ movieName: story.movieName, text: story.text });
    setAudioUri(story.audio);
    setShowStoryText(false);
  }, []);

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.root}
    >
      <NightSky />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Pressable onLongPress={onResetOnboarding} delayLongPress={800}>
              <Text style={styles.moonEmoji}>{"\ud83c\udf19"}</Text>
            </Pressable>
            <Text style={styles.titleMask}>Bollywood Bedtime</Text>
            <Text style={styles.subtitle}>
              Turn any movie into a sleepy-time story
            </Text>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            {/* Story player */}
            {currentStory && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.playerSection}>
                <Text style={styles.nowPlaying}>
                  {"\ud83c\udfac"} {currentStory.movieName}
                </Text>
                <AudioPlayer audioUri={audioUri} />
                <Pressable
                  onPress={() => setShowStoryText(!showStoryText)}
                  style={styles.storyToggle}
                >
                  <Text style={styles.storyToggleText}>
                    {showStoryText ? "\u25bc" : "\u25b6"}{" "}
                    {"\ud83d\udcd6"} Read the story text
                  </Text>
                </Pressable>
                {showStoryText && (
                  <ScrollView style={styles.storyTextScroll} nestedScrollEnabled>
                    <Text style={styles.storyText}>{currentStory.text}</Text>
                  </ScrollView>
                )}
              </Animated.View>
            )}

            {/* Featured stories */}
            <FeaturedStories onSelect={loadPrebuiltStory} />

            {/* Why sections */}
            <WhySection />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGoldFaint,
    alignItems: "center",
    gap: 8,
  },
  moonEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  titleMask: {
    fontFamily: fonts.heading,
    fontSize: 42,
    lineHeight: 52,
    textAlign: "center",
    color: colors.goldLight,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    fontFamily: fonts.body,
    textAlign: "center",
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },

  // Player
  playerSection: {
    marginBottom: 32,
  },
  nowPlaying: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
    marginBottom: 16,
  },

  // Story text toggle
  storyToggle: {
    marginTop: 20,
    paddingVertical: 8,
  },
  storyToggleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
  },
  storyTextScroll: {
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surfaceVeryFaint,
    borderWidth: 1,
    borderColor: colors.borderGoldFaint,
    maxHeight: 400,
  },
  storyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 27,
    color: colors.textPrimary,
  },
});
