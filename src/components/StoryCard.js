import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StoryArt from "./StoryArt";
import { CloseIcon } from "./Icons";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export const CARD_WIDTH = 148;

export default function StoryCard({ story, onPress, onDelete, width = CARD_WIDTH }) {
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => onPress(story)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Play ${story.title}, ${story.minutes} minutes`}
      >
        <StoryArt story={story} />
        <LinearGradient
          colors={["transparent", "rgba(5,2,15,0.6)", "rgba(5,2,15,0.97)"]}
          locations={[0.35, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {story.title}
          </Text>
          <Text style={styles.sub}>{story.minutes} min</Text>
        </View>
      </Pressable>
      {onDelete ? (
        <Pressable
          onPress={() => onDelete(story)}
          style={styles.delete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${story.title}`}
        >
          <CloseIcon size={12} color="rgba(255,255,255,0.9)" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(20,10,40,0.6)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  meta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 15,
    lineHeight: 19,
    color: colors.white,
  },
  sub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  delete: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
