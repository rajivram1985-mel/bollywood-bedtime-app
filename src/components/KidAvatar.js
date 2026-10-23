import { View, Text, StyleSheet } from "react-native";
import { fonts } from "../constants/typography";

// Marigold, rose, saffron, peacock teal, lavender, mango — warm, festive, distinct.
const PALETTE = ["#F5A524", "#F2A7B8", "#E9782F", "#5CC2B5", "#B9A7F2", "#FFD166"];

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
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: kidColor(kid) },
        size >= 40 && styles.ring,
      ]}
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
  ring: {
    borderWidth: 2,
    borderColor: "rgba(255,243,222,0.85)",
  },
  initial: {
    fontFamily: fonts.heading,
    color: "#1C1004",
  },
});
