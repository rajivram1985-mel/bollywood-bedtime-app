import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";
import { MOVIE_SUGGESTIONS } from "../constants/movieSuggestions";

export default function MovieSuggestions({ onSelectMovie }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>What story shall we tell tonight?</Text>
      <Text style={styles.subheader}>Pick a movie or type your own above</Text>

      {MOVIE_SUGGESTIONS.map((group) => (
        <View key={group.category} style={styles.categoryBlock}>
          <Text style={styles.categoryLabel}>
            {group.emoji} {group.category}
          </Text>
          <View style={styles.chipRow}>
            {group.movies.map((movie) => (
              <Pressable
                key={movie}
                onPress={() => onSelectMovie(movie)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{movie}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: "center",
  },
  header: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
    textAlign: "center",
    marginBottom: 6,
  },
  subheader: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: 28,
  },
  categoryBlock: {
    width: "100%",
    marginBottom: 18,
  },
  categoryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    backgroundColor: colors.surfaceLight,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.goldLight,
  },
});
