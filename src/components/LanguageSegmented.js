import { View, Text, Pressable, StyleSheet } from "react-native";
import { STORY_LANGUAGES } from "../constants/languages";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function LanguageSegmented({ value, onChange }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Story language">
      {STORY_LANGUAGES.map((l) => {
        const active = l.key === value;
        return (
          <Pressable
            key={l.key}
            onPress={() => onChange(l.key)}
            style={[styles.seg, active && styles.segActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={l.label}
            hitSlop={4}
          >
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {l.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: colors.night800,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  seg: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segActive: {
    backgroundColor: colors.gold,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.onGold,
  },
});
