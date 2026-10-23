import { View, Text, ScrollView, StyleSheet } from "react-native";
import StoryCard from "./StoryCard";
import { Phool } from "./Ornament";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function StoryRow({ title, subtitle, stories, onPlay, onDelete }) {
  if (!stories.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.titleRow}>
          <Phool size={11} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
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
    marginTop: 34,
  },
  heading: {
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: 27,
    color: colors.cream,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    marginLeft: 19,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 20,
    gap: 14,
  },
});
