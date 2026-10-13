import { View, Text, ScrollView, StyleSheet } from "react-native";
import StoryCard from "./StoryCard";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function StoryRow({ title, subtitle, stories, onPlay, onDelete }) {
  if (!stories.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        // Let the row bleed to the screen edge while aligning with the page gutter.
        style={styles.scroller}
      >
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} onPress={onPlay} onDelete={onDelete} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  heading: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    color: colors.goldLight,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 20,
    gap: 12,
  },
});
