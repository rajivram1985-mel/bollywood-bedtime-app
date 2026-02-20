import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import NightSky from "../components/NightSky";
import AudioPlayer from "../components/AudioPlayer";
import SavedStories from "../components/SavedStories";
import SettingsModal from "../components/SettingsModal";
import StoryLoader from "../components/StoryLoader";
import AgePicker from "../components/AgePicker";
import MovieSuggestions from "../components/MovieSuggestions";
import AnimatedPressable from "../components/AnimatedPressable";

import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";
import {
  STORAGE_KEYS,
  getSecure,
  setSecure,
  getData,
  setData,
} from "../utils/storage";
import {
  fetchVoices as apiFetchVoices,
  generateStory as apiGenerateStory,
  generateAudioBase64,
} from "../utils/api";
import { saveAudioFile } from "../utils/audio";

export default function HomeScreen() {
  const [movieName, setMovieName] = useState("");
  const [ageRange, setAgeRange] = useState("6-8");
  const [apiKey, setApiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedStories, setSavedStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null);
  const [error, setError] = useState(null);
  const [showStoryText, setShowStoryText] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    (async () => {
      const key = await getSecure(STORAGE_KEYS.API_KEY);
      if (key) setApiKey(key);

      const antKey = await getSecure(STORAGE_KEYS.ANTHROPIC_KEY);
      if (antKey) setAnthropicKey(antKey);

      const voiceStr = await getData(STORAGE_KEYS.VOICE_ID);
      if (voiceStr) {
        try {
          setSelectedVoice(JSON.parse(voiceStr));
        } catch {}
      }

      const storiesStr = await getData(STORAGE_KEYS.SAVED_STORIES);
      if (storiesStr) {
        try {
          setSavedStories(JSON.parse(storiesStr));
        } catch {}
      }

      const savedAge = await getData(STORAGE_KEYS.AGE_RANGE);
      if (savedAge) setAgeRange(savedAge);
    })();
  }, []);

  // Persist API key
  useEffect(() => {
    if (apiKey) setSecure(STORAGE_KEYS.API_KEY, apiKey);
  }, [apiKey]);

  // Persist Anthropic key
  useEffect(() => {
    if (anthropicKey) setSecure(STORAGE_KEYS.ANTHROPIC_KEY, anthropicKey);
  }, [anthropicKey]);

  // Persist selected voice
  useEffect(() => {
    if (selectedVoice)
      setData(STORAGE_KEYS.VOICE_ID, JSON.stringify(selectedVoice));
  }, [selectedVoice]);

  // Persist age range
  useEffect(() => {
    setData(STORAGE_KEYS.AGE_RANGE, ageRange);
  }, [ageRange]);

  const fetchVoices = useCallback(async (key) => {
    setLoadingVoices(true);
    setError(null);
    try {
      const voiceList = await apiFetchVoices(key);
      setVoices(voiceList);
    } catch (e) {
      if (e.message === "INVALID_KEY") {
        setError("Invalid API key. Please double-check your ElevenLabs API key.");
      } else if (e.message === "NO_VOICES") {
        setError("No voices found on your ElevenLabs account.");
      } else if (e.message === "API_ERROR") {
        setError("ElevenLabs API returned an error. Please try again.");
      } else {
        setError("Could not fetch voices: " + e.message);
      }
    }
    setLoadingVoices(false);
  }, []);

  const generateStory = useCallback(async () => {
    if (!movieName.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    if (!selectedVoice) {
      setError("Please select a voice in Settings first.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUri(null);
    setCurrentStory(null);
    setShowStoryText(false);
    setLoadingStage("story");

    try {
      const storyText = await apiGenerateStory(
        anthropicKey,
        movieName.trim(),
        ageRange
      );
      setCurrentStory({
        movieName: movieName.trim(),
        text: storyText,
        savedAt: null,
      });

      // Generate audio
      setLoadingStage("audio");
      const base64 = await generateAudioBase64(
        apiKey,
        selectedVoice.voice_id,
        storyText
      );
      const fileUri = await saveAudioFile(base64, `story_${Date.now()}.mp3`);
      setAudioUri(fileUri);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
    setLoadingStage(null);
  }, [movieName, apiKey, anthropicKey, selectedVoice, ageRange]);

  const saveStory = useCallback(async () => {
    if (!currentStory) return;
    const story = { ...currentStory, savedAt: new Date().toISOString() };
    const updated = [...savedStories, story];
    setSavedStories(updated);
    setCurrentStory(story);
    await setData(STORAGE_KEYS.SAVED_STORIES, JSON.stringify(updated));
  }, [currentStory, savedStories]);

  const deleteSavedStory = useCallback(
    async (index) => {
      const updated = savedStories.filter((_, i) => i !== index);
      setSavedStories(updated);
      await setData(STORAGE_KEYS.SAVED_STORIES, JSON.stringify(updated));
    },
    [savedStories]
  );

  const regenAudio = useCallback(
    async (text) => {
      if (!apiKey || !selectedVoice) {
        setError("Set up your API key and voice in Settings first.");
        return;
      }
      setLoading(true);
      setLoadingStage("audio");
      setError(null);
      try {
        const base64 = await generateAudioBase64(
          apiKey,
          selectedVoice.voice_id,
          text
        );
        const fileUri = await saveAudioFile(base64, `story_${Date.now()}.mp3`);
        setAudioUri(fileUri);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
      setLoadingStage(null);
    },
    [apiKey, selectedVoice]
  );

  const loadSavedStory = useCallback(
    (story) => {
      setCurrentStory(story);
      setMovieName(story.movieName);
      setAudioUri(null);
      setShowStoryText(false);
      regenAudio(story.text);
    },
    [regenAudio]
  );

  const isSaved = currentStory?.savedAt != null;

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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.moonEmoji}>{"\ud83c\udf19"}</Text>
              <View>
                <MaskedView
                  maskElement={
                    <Text style={styles.titleMask}>Bollywood Bedtime</Text>
                  }
                >
                  <LinearGradient
                    colors={[colors.goldLight, colors.gold, colors.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.titleMask, { opacity: 0 }]}>
                      Bollywood Bedtime
                    </Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.subtitle}>
                  Turn any movie into a sleepy-time story
                </Text>
              </View>
            </View>
            <View style={styles.headerButtons}>
              <AnimatedPressable
                onPress={() => setShowSaved(true)}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonText}>
                  {"\ud83d\udcda"} Saved{" "}
                  {savedStories.length > 0 && `(${savedStories.length})`}
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => {
                  setShowSettings(true);
                  if (apiKey && voices.length === 0) fetchVoices(apiKey);
                }}
                style={styles.headerButton}
              >
                <Text style={styles.headerButtonText}>
                  {"\u2699\ufe0f"} Settings
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* Main content area */}
          <View style={styles.content}>
            {/* Setup prompt */}
            {(!apiKey || !anthropicKey) && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(100)}
                style={styles.infoBanner}
              >
                <Text style={styles.infoBannerText}>
                  {"\ud83d\udc4b"} Welcome! Open{" "}
                  <Text style={{ fontFamily: fonts.bodyBold }}>Settings</Text>{" "}
                  to add your{" "}
                  {!apiKey && "ElevenLabs"}
                  {!apiKey && !anthropicKey && " and "}
                  {!anthropicKey && "Anthropic"} API key
                  {!apiKey && !anthropicKey ? "s" : ""}.
                </Text>
              </Animated.View>
            )}

            {/* Search input row */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              style={styles.inputRow}
            >
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>{"\ud83c\udfac"}</Text>
                <TextInput
                  style={styles.input}
                  value={movieName}
                  onChangeText={setMovieName}
                  onSubmitEditing={generateStory}
                  returnKeyType="go"
                  placeholder="Type a Bollywood movie name..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                />
              </View>
              <AnimatedPressable
                onPress={generateStory}
                disabled={loading || !movieName.trim()}
                style={{ opacity: loading || !movieName.trim() ? 0.4 : 1 }}
              >
                <LinearGradient
                  colors={
                    loading || !movieName.trim()
                      ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]
                      : [colors.gold, colors.orange]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateButton}
                >
                  <Text style={styles.generateButtonText}>
                    Tell me a story {"\u2728"}
                  </Text>
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>

            {/* Age picker */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <AgePicker selected={ageRange} onSelect={setAgeRange} />
            </Animated.View>

            {/* Error */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.errorBanner}
              >
                <Text style={styles.errorText}>
                  {"\u26a0\ufe0f"} {error}
                </Text>
              </Animated.View>
            )}

            {/* Loading */}
            {loading && <StoryLoader stage={loadingStage} />}

            {/* Result */}
            {!loading && currentStory && (
              <Animated.View entering={FadeIn.duration(500)}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>
                    {"\ud83c\udfac"} {currentStory.movieName}
                  </Text>
                  {!isSaved ? (
                    <AnimatedPressable
                      onPress={saveStory}
                      style={styles.saveButton}
                    >
                      <Text style={styles.saveButtonText}>
                        {"\ud83d\udd16"} Save Story
                      </Text>
                    </AnimatedPressable>
                  ) : (
                    <Text style={styles.savedLabel}>
                      {"\u2705"} Saved
                    </Text>
                  )}
                </View>

                {/* Audio player */}
                {audioUri && <AudioPlayer audioUri={audioUri} />}

                {/* Collapsible story text (replaces <details>/<summary>) */}
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
                  <ScrollView
                    style={styles.storyTextScroll}
                    nestedScrollEnabled
                  >
                    <Text style={styles.storyText}>
                      {currentStory.text}
                    </Text>
                  </ScrollView>
                )}
              </Animated.View>
            )}

            {/* Empty state — movie suggestions */}
            {!loading && !currentStory && (
              <MovieSuggestions onSelectMovie={setMovieName} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          anthropicKey={anthropicKey}
          setAnthropicKey={setAnthropicKey}
          voices={voices}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          onClose={() => setShowSettings(false)}
          onFetchVoices={fetchVoices}
          loadingVoices={loadingVoices}
        />
      )}

      {showSaved && (
        <SavedStories
          stories={savedStories}
          onSelect={loadSavedStory}
          onDelete={deleteSavedStory}
          onClose={() => setShowSaved(false)}
        />
      )}
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGoldFaint,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  moonEmoji: {
    fontSize: 32,
  },
  titleMask: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    fontFamily: fonts.body,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
  },
  headerButtonText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.goldLight,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },

  // Info banner
  infoBanner: {
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoBannerText: {
    fontSize: 15,
    color: colors.goldLight,
    fontFamily: fonts.body,
  },

  // Input row
  inputRow: {
    marginBottom: 24,
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surfaceInput,
  },
  inputIcon: {
    fontSize: 20,
    paddingLeft: 16,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 17,
  },
  generateButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonText: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.white,
  },

  // Error
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fonts.body,
  },

  // Result
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
    flexShrink: 1,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.saveBg,
    borderWidth: 1,
    borderColor: colors.saveBorder,
  },
  saveButtonText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.gold,
  },
  savedLabel: {
    fontSize: 14,
    color: colors.savedText,
    fontFamily: fonts.body,
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
