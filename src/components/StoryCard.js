import { View, Text, Pressable, StyleSheet } from "react-native";
import ArchFrame from "./ArchFrame";
import StoryArt from "./StoryArt";
import { CloseIcon } from "./Icons";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export const CARD_WIDTH = 140;

// A story on the shelf: the artwork in an arched window, the title beneath.
export default function StoryCard({ story, onPress, onDelete, width = CARD_WIDTH }) {
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => onPress(story)}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Play ${story.title}, ${story.minutes} minutes`}
      >
        <ArchFrame width={width} style={{ height: width * 1.36 }} inset={5} bottomRadius={14}>
          <StoryArt story={story} emojiSize={36} />
        </ArchFrame>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.sub}>{story.minutes} min</Text>
      </Pressable>
      {onDelete ? (
        <Pressable
          onPress={() => onDelete(story)}
          style={styles.delete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${story.title}`}
        >
          <CloseIcon size={12} color={colors.cream} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  press: {
    gap: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  title: {
    fontFamily: fonts.headingMedium,
    fontSize: 15,
    lineHeight: 19,
    color: colors.textPrimary,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
    paddingHorizontal: 2,
  },
  delete: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(8,7,28,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
});
