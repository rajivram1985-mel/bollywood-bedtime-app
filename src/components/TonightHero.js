import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StoryArt from "./StoryArt";
import { PlayIcon } from "./Icons";
import { ageLabel } from "../constants/ageRanges";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function TonightHero({ story, kidName, onPlay }) {
  if (!story) return null;
  return (
    <Pressable
      onPress={() => onPlay(story)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Tonight's pick: ${story.title}. ${story.minutes} minutes. Double tap to play.`}
    >
      <StoryArt story={story} emojiSize={64} />
      <LinearGradient
        colors={["rgba(5,2,15,0.05)", "rgba(5,2,15,0.55)", "rgba(5,2,15,0.97)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{kidName ? `Tonight's pick for ${kidName}` : "Tonight's pick"}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.tagline} numberOfLines={2}>
          {story.tagline}
        </Text>
        <View style={styles.footer}>
          <LinearGradient
            colors={[colors.goldLight, colors.gold, colors.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playBtn}
          >
            <PlayIcon size={16} color={colors.onGold} />
            <Text style={styles.playText}>Play story</Text>
          </LinearGradient>
          <Text style={styles.meta}>
            {story.minutes} min · Ages {ageLabel(story.ageRange)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    aspectRatio: 4 / 5,
    maxHeight: 460,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: "#140c2e",
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    gap: 6,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 38,
    color: colors.white,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  playText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.onGold,
  },
  meta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
