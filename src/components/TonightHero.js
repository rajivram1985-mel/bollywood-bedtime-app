import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import ArchFrame from "./ArchFrame";
import StoryArt from "./StoryArt";
import { PlayIcon } from "./Icons";
import { Phool } from "./Ornament";
import { ageLabel } from "../constants/ageRanges";
import { languageLabel } from "../constants/languages";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const WIDE = 680;

// Tonight's pick: one window, one story, one button. Centred on phones (like
// a lit window at night); side by side on wide screens.
export default function TonightHero({ story, kidName, onPlay }) {
  const [width, setWidth] = useState(0);
  if (!story) return null;

  const wide = width >= WIDE;
  const artWidth = wide ? 260 : Math.min(250, Math.max(180, width * 0.66));
  const meta = [
    `${story.minutes} min`,
    `Ages ${ageLabel(story.ageRange)}`,
    story.language && story.language !== "en" ? languageLabel(story.language) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <View style={wide ? styles.rowWide : styles.colNarrow}>
          <Pressable
            onPress={() => onPlay(story)}
            style={({ pressed }) => pressed && styles.pressed}
            accessibilityRole="button"
            accessibilityLabel={`Tonight's pick: ${story.title}. ${story.minutes} minutes. Double tap to play.`}
          >
            <ArchFrame width={artWidth} style={{ height: artWidth * 1.3 }} glow>
              <StoryArt story={story} emojiSize={56} />
            </ArchFrame>
          </Pressable>

          <View style={wide ? styles.textWide : styles.textNarrow}>
            <View style={[styles.eyebrowRow, !wide && styles.centerRow]}>
              <Phool size={10} />
              <Text style={styles.eyebrow}>{kidName ? `Tonight's pick for ${kidName}` : "Tonight's pick"}</Text>
              {!wide ? <Phool size={10} /> : null}
            </View>
            <Text style={[styles.title, !wide && styles.center]} numberOfLines={2}>
              {story.title}
            </Text>
            <Text style={[styles.tagline, !wide && styles.center]} numberOfLines={3}>
              {story.tagline}
            </Text>
            <Pressable
              onPress={() => onPlay(story)}
              style={({ pressed }) => [styles.playBtn, !wide && styles.selfCenter, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Play ${story.title}`}
            >
              <PlayIcon size={16} color={colors.onGold} />
              <Text style={styles.playText}>Play story</Text>
            </Pressable>
            <Text style={[styles.meta, !wide && styles.center]}>{meta}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, minHeight: 200 },
  colNarrow: { alignItems: "center", gap: 18 },
  rowWide: { flexDirection: "row", alignItems: "center", gap: 36 },
  textNarrow: { alignItems: "stretch", gap: 6, maxWidth: 420 },
  textWide: { flex: 1, gap: 8 },

  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  centerRow: { justifyContent: "center" },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.marigold,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 34,
    lineHeight: 40,
    color: colors.cream,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  center: { textAlign: "center" },
  selfCenter: { alignSelf: "center" },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: colors.marigold,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  playText: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.onGold,
  },
  meta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
