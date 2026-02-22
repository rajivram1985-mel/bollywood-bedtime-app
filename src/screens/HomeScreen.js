import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import NightSky from "../components/NightSky";
import AudioPlayer from "../components/AudioPlayer";
import SpeechPlayer from "../components/SpeechPlayer";
import GenerateStory from "../components/GenerateStory";
import FeaturedStories from "../components/FeaturedStories";
import WhySection from "../components/WhySection";

import { getData, setData, STORAGE_KEYS } from "../utils/storage";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const WIDE_BREAKPOINT = 900;

export default function HomeScreen({ onResetOnboarding }) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [currentStory, setCurrentStory] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [showStoryText, setShowStoryText] = useState(false);
  const [generatedStories, setGeneratedStories] = useState([]);

  // Load saved generated stories on mount
  useEffect(() => {
    getData(STORAGE_KEYS.GENERATED_STORIES).then((val) => {
      if (val) setGeneratedStories(JSON.parse(val));
    });
  }, []);

  const loadPrebuiltStory = useCallback((story) => {
    setCurrentStory({ movieName: story.movieName, text: story.text });
    setAudioUri(story.audio);
    setShowStoryText(false);
  }, []);

  const loadGeneratedStory = useCallback((story) => {
    setCurrentStory({ movieName: story.movieName, text: story.text });
    setAudioUri(null);
    setShowStoryText(false);
  }, []);

  // Called after a new story is generated — saves it and plays it
  const handleGenerated = useCallback((story) => {
    loadGeneratedStory(story);
    setGeneratedStories((prev) => {
      const filtered = prev.filter((s) => s.movieName !== story.movieName);
      const updated = [{ ...story, savedAt: new Date().toISOString() }, ...filtered];
      setData(STORAGE_KEYS.GENERATED_STORIES, JSON.stringify(updated));
      return updated;
    });
  }, [loadGeneratedStory]);

  const deleteGeneratedStory = useCallback((movieName) => {
    setGeneratedStories((prev) => {
      const updated = prev.filter((s) => s.movieName !== movieName);
      setData(STORAGE_KEYS.GENERATED_STORIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentStory(null);
    setAudioUri(null);
    setShowStoryText(false);
  }, []);

  const playerSection = currentStory && (
    <Animated.View entering={FadeIn.duration(500)} style={styles.playerSection}>
      <View style={styles.playerHeader}>
        <Text style={styles.nowPlaying}>
          {"\ud83c\udfac"} {currentStory.movieName}
        </Text>
        <Pressable onPress={closePlayer} style={styles.closeBtn} hitSlop={10}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>
      {audioUri ? (
        <AudioPlayer audioUri={audioUri} />
      ) : (
        <SpeechPlayer text={currentStory.text} />
      )}
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
  );

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
          {/* Header — always full width */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Pressable onLongPress={onResetOnboarding} delayLongPress={800}>
              <Text style={styles.moonEmoji}>{"\ud83c\udf19"}</Text>
            </Pressable>
            <Text style={styles.titleMask}>Bollywood Bedtime</Text>
            <Text style={styles.subtitle}>
              Turn any movie into a sleepy-time story
            </Text>
          </Animated.View>

          {/* Body — 3-column on wide, single column on narrow */}
          {isWide ? (
            <View style={styles.wideBody}>
              {/* Left sidebar: Why bedtime stories */}
              <View style={styles.sidebar}>
                <WhySection section="sleep" compact />
              </View>

              {/* Centre: player + generate + movie cards */}
              <View style={styles.centerCol}>
                {playerSection}
                <GenerateStory onGenerated={handleGenerated} />
                <FeaturedStories onSelect={loadPrebuiltStory} generatedStories={generatedStories} onDeleteGenerated={deleteGeneratedStory} />
              </View>

              {/* Right sidebar: Why Bollywood */}
              <View style={styles.sidebar}>
                <WhySection section="bollywood" compact />
              </View>
            </View>
          ) : (
            <View style={styles.narrowBody}>
              {playerSection}
              <GenerateStory onGenerated={handleGenerated} />
              <FeaturedStories onSelect={loadPrebuiltStory} generatedStories={generatedStories} onDeleteGenerated={deleteGeneratedStory} />
              <WhySection />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 60 },

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

  // ── Wide layout (≥900px) ───────────────────────────────────────────────────
  wideBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 28,
    maxWidth: 1300,
    alignSelf: "center",
    width: "100%",
    gap: 28,
  },
  sidebar: {
    width: 230,
    flexShrink: 0,
    paddingTop: 4,
    borderRightWidth: 0,
  },
  centerCol: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },

  // ── Narrow layout (<900px) ─────────────────────────────────────────────────
  narrowBody: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },

  // Player
  playerSection: {
    marginBottom: 28,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nowPlaying: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textTertiary,
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
