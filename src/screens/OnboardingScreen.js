import { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp, FadeInRight, FadeInLeft } from "react-native-reanimated";
import NightSky from "../components/NightSky";
import { AGE_RANGES } from "../constants/ageRanges";
import { STORAGE_KEYS, setData } from "../utils/storage";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const TOTAL_SLIDES = 3;

// ─── Slide 1: Welcome ────────────────────────────────────────────────────────
function SlideWelcome() {
  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.moon}>
        🌙
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(500).delay(120)} style={styles.headline}>
        Welcome to{"\n"}Bollywood Bedtime
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(500).delay(260)} style={styles.body}>
        Turn your favourite Bollywood films into calming bedtime stories your little one will love.
      </Animated.Text>
    </View>
  );
}

// ─── Slide 2: How it works ───────────────────────────────────────────────────
function SlideHowItWorks() {
  const steps = [
    { emoji: "🎬", text: "Pick any Bollywood film" },
    { emoji: "✨", text: "We craft a bedtime story" },
    { emoji: "😴", text: "Press play & drift off" },
  ];
  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headline}>
        How it works
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(500).delay(120)} style={styles.body}>
        Three simple steps to the perfect bedtime, every night.
      </Animated.Text>
      <View style={styles.stepsList}>
        {steps.map((s, i) => (
          <Animated.View
            key={s.text}
            entering={FadeInUp.duration(440).delay(200 + i * 110)}
            style={styles.stepRow}
          >
            <Text style={styles.stepEmoji}>{s.emoji}</Text>
            <Text style={styles.stepText}>{s.text}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ─── Slide 3: Age picker ─────────────────────────────────────────────────────
function SlideAgePicker({ selectedAge, onSelectAge }) {
  return (
    <View style={styles.slide}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headline}>
        How old is your{"\n"}little one?
      </Animated.Text>
      <Animated.Text entering={FadeInUp.duration(500).delay(120)} style={styles.body}>
        We tailor the vocabulary and story length to match their age.
      </Animated.Text>
      <View style={styles.ageGrid}>
        {AGE_RANGES.map((range, i) => {
          const active = selectedAge === range.key;
          return (
            <Animated.View
              key={range.key}
              entering={FadeInUp.duration(440).delay(220 + i * 90)}
              style={styles.ageCardWrapper}
            >
              <Pressable
                onPress={() => onSelectAge(range.key)}
                style={[styles.ageCard, active && styles.ageCardActive]}
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
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedAge, setSelectedAge] = useState(null);

  const goTo = (next) => {
    setDirection(next > slide ? 1 : -1);
    setSlide(next);
  };

  const handleComplete = async () => {
    if (!selectedAge) return;
    await Promise.all([
      setData(STORAGE_KEYS.AGE_RANGE, selectedAge),
      setData(STORAGE_KEYS.ONBOARDING_DONE, "1"),
    ]);
    onComplete();
  };

  const entering = direction >= 0 ? FadeInRight.duration(360) : FadeInLeft.duration(360);
  const isLastSlide = slide === TOTAL_SLIDES - 1;
  const canFinish = isLastSlide && !!selectedAge;

  const primaryLabel = isLastSlide ? "Start Listening" : "Continue";

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.root}
    >
      <NightSky />
      <SafeAreaView style={styles.safeArea}>

        {/* Slide */}
        <View style={styles.slideArea}>
          <Animated.View key={`slide-${slide}`} entering={entering} style={styles.slideWrapper}>
            {slide === 0 && <SlideWelcome />}
            {slide === 1 && <SlideHowItWorks />}
            {slide === 2 && (
              <SlideAgePicker selectedAge={selectedAge} onSelectAge={setSelectedAge} />
            )}
          </Animated.View>
        </View>

        {/* Bottom nav */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.bottomNav}>

          {/* Dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
            ))}
          </View>

          {/* Primary CTA */}
          <Pressable
            onPress={isLastSlide ? handleComplete : () => goTo(slide + 1)}
            disabled={isLastSlide && !canFinish}
            style={[styles.primaryBtn, isLastSlide && !canFinish && styles.primaryBtnDisabled]}
          >
            <Text style={[styles.primaryBtnText, isLastSlide && !canFinish && styles.primaryBtnTextDisabled]}>
              {primaryLabel}
            </Text>
          </Pressable>

          {/* Back link */}
          {slide > 0 ? (
            <Pressable onPress={() => goTo(slide - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  // Slide area fills all available space and centres content
  slideArea: {
    flex: 1,
    justifyContent: "center",
  },
  slideWrapper: {
    width: "100%",
  },

  // ── Slide shell ───────────────────────────────────────────────────────────
  slide: {
    paddingHorizontal: 36,
    alignItems: "center",
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },

  // ── Typography ────────────────────────────────────────────────────────────
  moon: {
    fontSize: 72,
    textAlign: "center",
    marginBottom: 28,
  },
  headline: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 42,
    color: colors.white,
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginBottom: 0,
  },

  // ── Slide 2: Steps ────────────────────────────────────────────────────────
  stepsList: {
    marginTop: 40,
    gap: 24,
    width: "100%",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepEmoji: {
    fontSize: 28,
    width: 40,
    textAlign: "center",
  },
  stepText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },

  // ── Slide 3: Age ─────────────────────────────────────────────────────────
  ageGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 36,
    width: "100%",
  },
  ageCardWrapper: {
    flex: 1,
  },
  ageCard: {
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ageCardActive: {
    borderColor: colors.white,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  ageEmoji: {
    fontSize: 28,
  },
  ageLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  ageLabelActive: {
    color: colors.white,
  },
  ageDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    lineHeight: 15,
  },
  ageDescActive: {
    color: "rgba(255,255,255,0.6)",
  },

  // ── Bottom nav ────────────────────────────────────────────────────────────
  bottomNav: {
    paddingHorizontal: 36,
    paddingBottom: 28,
    paddingTop: 8,
    alignItems: "center",
    gap: 16,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.white,
  },

  // White solid button — Disney+ style
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  primaryBtnText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.bgTop,
  },
  primaryBtnTextDisabled: {
    color: "rgba(255,255,255,0.35)",
  },

  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  backBtnPlaceholder: {
    height: 32,
  },
});
