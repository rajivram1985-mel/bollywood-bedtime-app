import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { generateStory } from "../utils/api";
import { fetchMoviePoster } from "../utils/tmdb";
import { CloseIcon } from "./Icons";
import { Phool } from "./Ornament";
import { ageLabel } from "../constants/ageRanges";
import { languageLabel } from "../constants/languages";
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

function LoadingDots() {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <PulseDot key={i} delay={i * 160} />
      ))}
    </View>
  );
}

function PulseDot({ delay }) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 + delay }), withTiming(0.2, { duration: 500 + delay })),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function GenerateStory({ ageRange = "6-8", language = "en", kidName, onGenerated }) {
  const [movieName, setMovieName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const canSubmit = !!movieName.trim() && !loading;

  const handleGenerate = async () => {
    const name = movieName.trim();
    if (!name || loading) return;
    setLoading(true);
    setError(null);
    try {
      const text = await generateStory(name, ageRange, language);
      const posterUrl = await fetchMoviePoster(name);
      onGenerated({ movieName: name, text, ageRange, language, posterUrl: posterUrl ?? null });
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

  const forWhom = [
    kidName ? `for ${kidName}` : null,
    `ages ${ageLabel(ageRange)}`,
    language !== "en" ? `in ${languageLabel(language)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Phool size={11} />
        <Text style={styles.title}>Make a story from any film</Text>
      </View>
      <Text style={styles.subtitle}>
        Name a film your family loves and we'll write a gentle bedtime version — {forWhom}. Written by AI; it's saved
        under "Made by you".
      </Text>

      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          ref={inputRef}
          value={movieName}
          onChangeText={(v) => {
            setMovieName(v);
            setError(null);
          }}
          placeholder="e.g. Andaz Apna Apna"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          editable={!loading}
          onSubmitEditing={handleGenerate}
          returnKeyType="go"
          maxLength={60}
          accessibilityLabel="Film name"
        />
        {movieName.length > 0 && !loading ? (
          <Pressable onPress={() => setMovieName("")} style={styles.clearBtn} hitSlop={8} accessibilityLabel="Clear">
            <CloseIcon size={14} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
        {SUGGESTIONS.map((name) => {
          const active = movieName === name;
          return (
            <Pressable
              key={name}
              onPress={() => pickSuggestion(name)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <LoadingDots />
          <Text style={styles.loadingTitle}>Writing a bedtime "{movieName}"…</Text>
          <Text style={styles.loadingHint}>This takes about 20 seconds</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleGenerate}
          disabled={!canSubmit}
          style={({ pressed }) => [styles.generateBtn, !canSubmit && styles.generateBtnDisabled, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
        >
          <Text style={[styles.generateBtnText, !canSubmit && styles.generateBtnTextDisabled]}>Write the story</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 20,
    gap: 14,
    marginHorizontal: 20,
    marginTop: 40,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, color: colors.cream },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textTertiary, marginTop: -6 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.night800,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  inputRowError: { borderColor: colors.error },
  input: {
    flex: 1,
    height: 52,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.cream,
    outlineStyle: "none",
  },
  clearBtn: { padding: 6 },

  suggestionsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
  },
  chipActive: { borderColor: colors.marigold, backgroundColor: "rgba(245,165,36,0.14)" },
  chipPressed: { opacity: 0.7 },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.marigoldSoft },

  errorText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.error, lineHeight: 18 },

  loadingBox: { alignItems: "center", paddingVertical: 12, gap: 8 },
  dotsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.marigold },
  loadingTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.marigoldSoft, textAlign: "center" },
  loadingHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary },

  generateBtn: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.marigold,
  },
  generateBtnDisabled: { backgroundColor: colors.chip },
  generateBtnText: { fontFamily: fonts.heading, fontSize: 16, color: colors.onGold },
  generateBtnTextDisabled: { color: colors.textTertiary },
});
