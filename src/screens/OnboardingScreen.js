import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, Mask, Rect, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import NightSky from "../components/NightSky";
import ArchFrame from "../components/ArchFrame";
import { Divider } from "../components/Ornament";
import LanguageSegmented from "../components/LanguageSegmented";
import { AGE_RANGES } from "../constants/ageRanges";
import { STORY_LANGUAGES, DEFAULT_LANGUAGE } from "../constants/languages";
import { useProfiles } from "../state/ProfileContext";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

// ─── Brand moment: a crescent moon seen through a jharokha ───────────────────
function MoonWindow() {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <ArchFrame width={136} style={{ height: 172 }} glow>
      <LinearGradient colors={[colors.night500, colors.night700]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 136 172" style={StyleSheet.absoluteFill}>
        <Path d="M30 54 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill={colors.marigoldSoft} opacity={0.8} />
        <Path d="M104 40 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill={colors.marigoldSoft} opacity={0.6} />
        <Circle cx={100} cy={128} r={1.6} fill={colors.cream} opacity={0.5} />
        <Circle cx={38} cy={120} r={1.2} fill={colors.cream} opacity={0.4} />
      </Svg>
      <Animated.View style={[styles.moonWrap, floatStyle]}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Defs>
            <Mask id="crescent">
              <Rect width="64" height="64" fill="white" />
              <Circle cx="42" cy="24" r="24" fill="black" />
            </Mask>
          </Defs>
          <Circle cx="30" cy="34" r="27" fill={colors.marigoldSoft} mask="url(#crescent)" />
        </Svg>
      </Animated.View>
    </ArchFrame>
  );
}

// ─── Single-screen onboarding: who's listening (name, age, language) ─────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { addKid } = useProfiles();
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState(null);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  // Adding the first child is what completes onboarding (App switches to Home).
  const handleComplete = () => {
    if (!selectedAge) return;
    addKid({ name, ageRange: selectedAge, language });
  };

  const canFinish = !!selectedAge;

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.root}
    >
      <NightSky />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.brand}>
            <MoonWindow />
            <Text style={styles.brandName}>Bollywood Bedtime</Text>
            <Text style={styles.brandLine}>Gentle bedtime stories from the films we grew up with</Text>
            <Divider width={140} />
          </Animated.View>

          <View style={styles.form}>
            <Animated.Text entering={FadeInUp.duration(500).delay(120)} style={styles.headline}>
              Who's listening tonight?
            </Animated.Text>

            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.field}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Their name (optional)"
                placeholderTextColor={colors.textTertiary}
                style={styles.nameInput}
                maxLength={24}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="Child's name, optional"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(280)} style={styles.field}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.ageRow} accessibilityRole="radiogroup">
                {AGE_RANGES.map((range) => {
                  const active = selectedAge === range.key;
                  return (
                    <Pressable
                      key={range.key}
                      onPress={() => setSelectedAge(range.key)}
                      style={({ pressed }) => [styles.ageCard, active && styles.ageCardActive, pressed && styles.pressed]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${range.label}. ${range.description}`}
                    >
                      <Text style={[styles.ageNumber, active && styles.ageNumberActive]}>{range.short}</Text>
                      <Text style={styles.ageUnit}>years</Text>
                      <Text style={styles.ageDesc}>{range.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(360)} style={styles.field}>
              <Text style={styles.label}>Stories in</Text>
              <LanguageSegmented value={language} onChange={setLanguage} />
              <Text style={styles.hint}>{STORY_LANGUAGES.find((l) => l.key === language)?.description}</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.duration(600).delay(450)} style={styles.cta}>
            <Pressable
              onPress={handleComplete}
              disabled={!canFinish}
              style={({ pressed }) => [styles.primaryBtn, !canFinish && styles.primaryBtnDisabled, pressed && canFinish && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canFinish }}
            >
              <Text style={[styles.primaryBtnText, !canFinish && styles.primaryBtnTextDisabled]}>Start listening</Text>
            </Pressable>
            <Text style={styles.hint}>{canFinish ? "You can add brothers and sisters later." : "Pick an age to continue"}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },

  brand: { alignItems: "center", gap: 10, width: "100%", maxWidth: 460, marginBottom: 28 },
  moonWrap: { position: "absolute", top: 46, left: 0, right: 0, alignItems: "center" },
  brandName: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 38, color: colors.cream, marginTop: 14 },
  brandLine: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: "center", maxWidth: 300 },

  form: { width: "100%", maxWidth: 460, gap: 22 },
  headline: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.cream, textAlign: "center" },
  field: { gap: 10 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.textTertiary,
    textAlign: "center",
  },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textTertiary, textAlign: "center" },

  nameInput: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.cream,
    textAlign: "center",
    outlineStyle: "none",
  },

  ageRow: { flexDirection: "row", gap: 10 },
  ageCard: {
    flex: 1,
    minHeight: 128,
    paddingTop: 22,
    paddingBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  ageCardActive: { borderColor: colors.marigold, backgroundColor: "rgba(245,165,36,0.12)" },
  ageNumber: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.cream },
  ageNumberActive: { color: colors.marigoldSoft },
  ageUnit: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textTertiary, marginTop: -2 },
  ageDesc: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.textSecondary, textAlign: "center", marginTop: 8 },

  cta: { width: "100%", maxWidth: 420, marginTop: 30, gap: 12, alignItems: "center" },
  primaryBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.marigold,
  },
  primaryBtnDisabled: { backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.chipBorder },
  primaryBtnText: { fontFamily: fonts.heading, fontSize: 18, color: colors.onGold },
  primaryBtnTextDisabled: { color: colors.textTertiary },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
