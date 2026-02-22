import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { generateStory } from "../utils/api";
import { fetchMoviePoster } from "../utils/tmdb";
import { getData, STORAGE_KEYS } from "../utils/storage";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const SUGGESTIONS = [
  "Dil Chahta Hai",
  "PK",
  "Queen",
  "Swades",
  "Barfi!",
  "Andaz Apna Apna",
  "Zindagi Na Milegi Dobara",
  "Munna Bhai MBBS",
  "Dil Dhadakne Do",
  "Kabhi Khushi Kabhie Gham",
];

// Animated sparkle dots for the loading state
function LoadingDots() {
  const dots = [0, 1, 2];
  return (
    <View style={styles.dotsRow}>
      {dots.map((i) => (
        <PulseDot key={i} delay={i * 160} />
      ))}
    </View>
  );
}

function PulseDot({ delay }) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 + delay }),
        withTiming(0.2, { duration: 400 + delay })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function GenerateStory({ onGenerated }) {
  const [movieName, setMovieName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ageRange, setAgeRange] = useState("6-8");
  const inputRef = useRef(null);

  useEffect(() => {
    getData(STORAGE_KEYS.AGE_RANGE).then((val) => {
      if (val) setAgeRange(val);
    });
  }, []);

  const handleGenerate = async () => {
    const name = movieName.trim();
    if (!name || loading) return;
    setLoading(true);
    setError(null);
    try {
      const text = await generateStory(null, name, ageRange);
      const posterUrl = await fetchMoviePoster(name);
      onGenerated({ movieName: name, text, audio: null, posterUrl: posterUrl ?? null });
      setMovieName("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (name) => {
    setMovieName(name);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>🎬 What's tonight's story?</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        Select from the list below or name any movie which we'll turn into a cosy bedtime story.
      </Text>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          value={movieName}
          onChangeText={(v) => { setMovieName(v); setError(null); }}
          placeholder="e.g. Mughal-E-Azam, Andaz Apna Apna…"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          editable={!loading}
          onSubmitEditing={handleGenerate}
          returnKeyType="go"
        />
        {movieName.length > 0 && !loading && (
          <Pressable onPress={() => setMovieName("")} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Quick-pick suggestions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsRow}
      >
        {SUGGESTIONS.map((name) => (
          <Pressable
            key={name}
            onPress={() => pickSuggestion(name)}
            style={({ pressed }) => [
              styles.chip,
              movieName === name && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, movieName === name && styles.chipTextActive]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Error */}
      {error && <Text style={styles.errorText}>⚠️  {error}</Text>}

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingBox}>
          <LoadingDots />
          <Text style={styles.loadingTitle}>Crafting "{movieName}" bedtime story…</Text>
          <Text style={styles.loadingHint}>This takes about 20 seconds</Text>
        </View>
      ) : (
        /* Generate button */
        <Pressable
          onPress={handleGenerate}
          disabled={!movieName.trim()}
          style={({ pressed }) => [
            styles.generateBtnWrapper,
            pressed && { opacity: 0.85 },
          ]}
        >
          <LinearGradient
            colors={movieName.trim() ? [colors.gold, colors.orange] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateBtn}
          >
            <Text style={[styles.generateBtnText, !movieName.trim() && styles.generateBtnTextDisabled]}>
              ✨  Generate bedtime story
            </Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 18, 55, 0.7)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: 20,
    gap: 14,
    marginBottom: 28,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.goldLight,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(246,166,35,0.18)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
  },
  aiBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 19,
    marginTop: -4,
  },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.white,
    outlineStyle: "none",
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Chips
  suggestionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: "rgba(246,166,35,0.12)",
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.gold,
    fontFamily: fonts.bodySemiBold,
  },

  // Error
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#ff8080",
    lineHeight: 18,
  },

  // Loading
  loadingBox: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  loadingTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.goldLight,
    textAlign: "center",
  },
  loadingHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Generate button
  generateBtnWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  generateBtn: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  generateBtnText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: "#1a0a00",
  },
  generateBtnTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
});
