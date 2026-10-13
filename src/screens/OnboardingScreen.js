import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import NightSky from "../components/NightSky";
import { AGE_RANGES } from "../constants/ageRanges";
import { useProfiles } from "../state/ProfileContext";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

// ─── Decorative: glowing moon + drifting sparkles ────────────────────────────
function MoonCluster() {
  const glow = useSharedValue(0.55);
  const float = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 2400 }),
        withTiming(0.55, { duration: 2400 })
      ),
      -1,
      true
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 3200 }),
        withTiming(0, { duration: 3200 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <View style={styles.moonCluster}>
      {/* Soft radial glow — a plain View with shadow renders as a hard disc on web/Android */}
      <Animated.View style={[styles.moonHalo, glowStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="halo" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={colors.gold} stopOpacity="0.45" />
              <Stop offset="1" stopColor={colors.gold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#halo)" />
        </Svg>
      </Animated.View>
      <Animated.Text style={[styles.moon, floatStyle]}>🌙</Animated.Text>
      <Sparkle top={2} left={"22%"} delay={0} />
      <Sparkle top={20} left={"78%"} delay={600} small />
      <Sparkle top={56} left={"15%"} delay={1200} small />
      <Sparkle top={62} left={"82%"} delay={1800} />
    </View>
  );
}

function Sparkle({ top, left, delay = 0, small = false }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.15, { duration: 900 })
        ),
        -1,
        true
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text
      style={[small ? styles.sparkleSmall : styles.sparkle, { top, left }, style]}
    >
      ✦
    </Animated.Text>
  );
}

// ─── Single-screen onboarding: who's listening (name + age) ──────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { addKid } = useProfiles();
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState(null);

  // Adding the first child is what completes onboarding (App switches to Home).
  const handleComplete = () => {
    if (!selectedAge) return;
    addKid({ name, ageRange: selectedAge });
  };

  const canFinish = !!selectedAge;

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.root}
    >
      <NightSky />
      <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Compact brand header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.brandHeader}>
            <MoonCluster />
            <Text style={styles.brandName}>Bollywood Bedtime</Text>
            <View style={styles.trustRow}>
              <Text style={styles.trustGlyph}>✦</Text>
              <Text style={styles.trustText}>
                A magical bedtime ritual, lovingly made for Indian families
              </Text>
              <Text style={styles.trustGlyph}>✦</Text>
            </View>
          </Animated.View>

          {/* Age picker — the only step */}
          <View style={styles.pickerBlock}>
            <Animated.Text
              entering={FadeInUp.duration(500).delay(120)}
              style={styles.headline}
            >
              Who's listening{"\n"}tonight?
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.duration(500).delay(240)}
              style={styles.body}
            >
              Every story is written for their age — simpler words for little ones, richer tales for big kids.
            </Animated.Text>

            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.nameWrap}>
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

            <View style={styles.ageGrid}>
              {AGE_RANGES.map((range, i) => {
                const active = selectedAge === range.key;
                return (
                  <Animated.View
                    key={range.key}
                    entering={FadeInUp.duration(440).delay(360 + i * 90)}
                    style={styles.ageCardWrapper}
                  >
                    <Pressable
                      onPress={() => setSelectedAge(range.key)}
                      style={[styles.ageCard, active && styles.ageCardActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${range.label}. ${range.description}`}
                    >
                      <Text style={styles.ageEmoji}>{range.emoji}</Text>
                      <Text style={[styles.ageLabel, active && styles.ageLabelActive]}>
                        {range.label}
                      </Text>
                      <Text style={[styles.ageDesc, active && styles.ageDescActive]}>
                        {range.description}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Primary CTA */}
          <Animated.View
            entering={FadeIn.duration(600).delay(500)}
            style={styles.ctaBlock}
          >
            <Pressable
              onPress={handleComplete}
              disabled={!canFinish}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                pressed && canFinish && { transform: [{ scale: 0.98 }] },
                !canFinish && styles.primaryBtnDisabledWrap,
              ]}
            >
              <LinearGradient
                colors={
                  canFinish
                    ? [colors.goldLight, colors.gold, colors.orange]
                    : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    !canFinish && styles.primaryBtnTextDisabled,
                  ]}
                >
                  Start Listening
                </Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.ctaHint}>
              {canFinish ? "You can add brothers and sisters later." : "Pick an age to continue"}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  // ── Brand header ──────────────────────────────────────────────────────────
  brandHeader: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
    maxWidth: 500,
  },
  brandName: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.goldLight,
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
  },

  // ── Moon cluster ──────────────────────────────────────────────────────────
  moonCluster: {
    width: 160,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  moonHalo: {
    position: "absolute",
    width: 200,
    height: 200,
  },
  moon: {
    fontSize: 76,
    textAlign: "center",
  },
  sparkle: {
    position: "absolute",
    fontSize: 16,
    color: colors.goldLight,
  },
  sparkleSmall: {
    position: "absolute",
    fontSize: 11,
    color: colors.goldLight,
  },

  // ── Trust line ────────────────────────────────────────────────────────────
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  trustGlyph: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.gold,
    opacity: 0.7,
  },
  trustText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    textTransform: "uppercase",
    flexShrink: 1,
  },

  // ── Picker block ──────────────────────────────────────────────────────────
  pickerBlock: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: 38,
    color: colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 380,
  },
  nameWrap: {
    width: "100%",
    marginBottom: 16,
  },
  nameInput: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.borderGoldMedium,
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.white,
    textAlign: "center",
    outlineStyle: "none",
  },

  // ── Age grid ──────────────────────────────────────────────────────────────
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  ageCardWrapper: {
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: 230,
  },
  ageCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    padding: 18,
    alignItems: "center",
    gap: 6,
    minHeight: 140,
    justifyContent: "center",
  },
  ageCardActive: {
    backgroundColor: "rgba(246,166,35,0.14)",
    borderColor: colors.gold,
  },
  ageEmoji: {
    fontSize: 32,
  },
  ageLabel: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.white,
    textAlign: "center",
  },
  ageLabelActive: {
    color: colors.goldLight,
  },
  ageDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 16,
  },
  ageDescActive: {
    color: "rgba(255,255,255,0.78)",
  },

  // ── CTA block ─────────────────────────────────────────────────────────────
  ctaBlock: {
    width: "100%",
    maxWidth: 420,
    marginTop: 32,
    alignItems: "center",
  },
  primaryBtnWrap: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnDisabledWrap: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  primaryBtnText: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: "#1a0a00",
    letterSpacing: 0.3,
  },
  primaryBtnTextDisabled: {
    color: "rgba(255,255,255,0.35)",
  },
  ctaHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 12,
    textAlign: "center",
  },
});
