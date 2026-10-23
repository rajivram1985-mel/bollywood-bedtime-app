import { View, Text, Pressable, StyleSheet } from "react-native";
import { AGE_RANGES } from "../constants/ageRanges";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

// Compact age picker used in Settings (onboarding uses the larger cards).
export default function AgeSegmented({ value, onChange, accessibilityLabel = "Age" }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {AGE_RANGES.map((a) => {
        const active = a.key === value;
        return (
          <Pressable
            key={a.key}
            onPress={() => onChange(a.key)}
            style={[styles.seg, active && styles.segActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`Ages ${a.short}`}
            hitSlop={4}
          >
            <Text style={[styles.text, active && styles.textActive]}>{a.short}</Text>
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segActive: {
    backgroundColor: colors.gold,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.onGold,
  },
});
