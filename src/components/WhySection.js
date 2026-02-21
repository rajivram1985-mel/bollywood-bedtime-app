import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const BEDTIME_BENEFITS = [
  {
    emoji: "🧠",
    title: "Boosts Brain Power",
    desc: "Stories build vocabulary, memory, and language skills that stay with children for life.",
  },
  {
    emoji: "😴",
    title: "Better Sleep",
    desc: "A calm narrative eases an active mind and creates a consistent, relaxing pre-sleep routine.",
  },
  {
    emoji: "❤️",
    title: "Bonding Time",
    desc: "Shared stories create magical moments — the kind of memories kids carry into adulthood.",
  },
  {
    emoji: "🌈",
    title: "Sparks Imagination",
    desc: "Adventures without leaving the bedroom. The best travel is through a well-told story.",
  },
];

const BOLLYWOOD_REASONS = [
  {
    emoji: "🎭",
    title: "Epic Storytelling",
    desc: "Love, courage, friendship, redemption — Bollywood masters every emotion in a single film.",
  },
  {
    emoji: "🌺",
    title: "Cultural Roots",
    desc: "Keep heritage and values alive for the next generation through stories they'll treasure.",
  },
  {
    emoji: "🎵",
    title: "Musical Magic",
    desc: "Iconic soundtracks and beloved characters reimagined as gentle, soothing bedtime tales.",
  },
  {
    emoji: "🦁",
    title: "Timeless Heroes",
    desc: "From Jai–Veeru to Rancho, classic heroes teach life's best lessons in the most vivid way.",
  },
];

function FeatureCard({ emoji, title, desc, delay, gradientA, gradientB }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(delay)}
      style={styles.card}
    >
      <LinearGradient colors={[gradientA, gradientB]} style={styles.cardInner}>
        <View style={styles.emojiRing}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function SectionDivider() {
  return (
    <View style={styles.divider}>
      <LinearGradient
        colors={["transparent", colors.borderGoldMedium, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />
      <Text style={styles.dividerGlyph}>✦</Text>
      <LinearGradient
        colors={["transparent", colors.borderGoldMedium, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerLine}
      />
    </View>
  );
}

function Section({ eyebrow, title, subtitle, items, cardGradients, baseDelay }) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <FeatureCard
            key={item.title}
            {...item}
            delay={baseDelay + i * 90}
            gradientA={cardGradients[0]}
            gradientB={cardGradients[1]}
          />
        ))}
      </View>
    </View>
  );
}

export default function WhySection() {
  return (
    <View style={styles.container}>
      <SectionDivider />

      <Section
        eyebrow="THE SCIENCE OF SLEEP"
        title="Why bedtime stories matter"
        subtitle="A nightly story isn't just a ritual — it's one of the best gifts you can give a growing mind."
        items={BEDTIME_BENEFITS}
        cardGradients={["rgba(139,92,246,0.13)", "rgba(255,200,60,0.06)"]}
        baseDelay={0}
      />

      <SectionDivider />

      <Section
        eyebrow="THE BOLLYWOOD DIFFERENCE"
        title="Why Bollywood stories are special"
        subtitle="India's greatest films are epic tales of heart, drama, and humanity — perfect bedtime inspiration."
        items={BOLLYWOOD_REASONS}
        cardGradients={["rgba(255,200,60,0.12)", "rgba(232,120,58,0.06)"]}
        baseDelay={100}
      />

      <SectionDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 52,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerGlyph: {
    fontSize: 14,
    color: colors.gold,
    opacity: 0.6,
  },

  // Section
  section: {
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.gold,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.white,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 34,
  },
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  // Card
  card: {
    flexBasis: "46%",
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    overflow: "hidden",
  },
  cardInner: {
    padding: 20,
    gap: 10,
    minHeight: 170,
  },
  emojiRing: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.goldLight,
    lineHeight: 20,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
