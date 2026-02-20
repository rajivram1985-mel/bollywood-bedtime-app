import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";
import { AGE_RANGES } from "../constants/ageRanges";

export default function AgePicker({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Story age range</Text>
      <View style={styles.row}>
        {AGE_RANGES.map((range) => {
          const isSelected = selected === range.key;
          return (
            <Pressable
              key={range.key}
              onPress={() => onSelect(range.key)}
              style={[styles.pill, isSelected && styles.pillSelected]}
            >
              <Text style={styles.emoji}>{range.emoji}</Text>
              <Text
                style={[styles.pillText, isSelected && styles.pillTextSelected]}
              >
                {range.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceVeryFaint,
  },
  pillSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.voiceSelectedBg,
  },
  emoji: {
    fontSize: 16,
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillTextSelected: {
    color: colors.goldLight,
  },
});
