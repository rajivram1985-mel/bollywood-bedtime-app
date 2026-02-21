import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PREBUILT_STORIES } from "../constants/prebuiltStories";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const MOVIE_EMOJIS = {
  "DDLJ": "🚂",
  "Sholay": "🏜️",
  "3 Idiots": "🎓",
  "Kuch Kuch Hota Hai": "💫",
  "Lagaan": "🏏",
};

export default function FeaturedStories({ onSelect }) {
  if (PREBUILT_STORIES.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✨ Ready to play</Text>
      <Text style={styles.subheader}>Tap any story — it plays instantly, no waiting</Text>
      <View style={styles.grid}>
        {PREBUILT_STORIES.map((story) => (
          <Pressable
            key={story.movieName}
            onPress={() => onSelect(story)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <LinearGradient
              colors={["rgba(255,200,60,0.13)", "rgba(255,100,30,0.07)"]}
              style={styles.cardGradient}
            >
              <Text style={styles.cardEmoji}>
                {MOVIE_EMOJIS[story.movieName] ?? "🎬"}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {story.movieName}
              </Text>
              <View style={styles.playBadge}>
                <Text style={styles.playBadgeText}>▶  Play</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
  },
  header: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.goldLight,
    textAlign: "center",
    marginBottom: 4,
  },
  subheader: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flexBasis: "18%",
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardGradient: {
    padding: 18,
    alignItems: "center",
    gap: 10,
    minHeight: 150,
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.goldLight,
    textAlign: "center",
  },
  playBadge: {
    marginTop: 4,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,180,50,0.15)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
  },
  playBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.gold,
  },
});
