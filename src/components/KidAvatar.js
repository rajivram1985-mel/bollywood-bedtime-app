import { View, Text, StyleSheet } from "react-native";
import { fonts } from "../constants/typography";

const PALETTE = ["#F6A623", "#E8783A", "#B98CFF", "#5FC8A8", "#FF8FB1", "#6FB7FF"];

export function kidColor(kid) {
  const seed = kid?.id ?? "";
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function KidAvatar({ kid, size = 36 }) {
  const initial = (kid?.name || "").trim().charAt(0).toUpperCase() || "★";
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: kidColor(kid) }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text style={[styles.initial, { fontSize: size * 0.46, lineHeight: size * 0.62 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: fonts.heading,
    color: "#1a0a00",
  },
});
