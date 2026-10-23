import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../constants/colors";

// Small decorative marks borrowed from block-print borders.

// A four-petal star, used beside section titles.
export function Phool({ size = 12, color = colors.marigold, opacity = 0.9 }) {
  const c = size / 2;
  const k = size * 0.16;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} opacity={opacity}>
      <Path
        d={`M${c} 0 Q${c + k} ${c - k} ${size} ${c} Q${c + k} ${c + k} ${c} ${size} Q${c - k} ${c + k} 0 ${c} Q${c - k} ${c - k} ${c} 0Z`}
        fill={color}
      />
    </Svg>
  );
}

// A thin rule with a dot-diamond-dot centre, used as a divider.
export function Divider({ width = 120, color = colors.marigold }) {
  return (
    <View style={[styles.divider, { width }]} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[styles.rule, { backgroundColor: color }]} />
      <Svg width={34} height={10} viewBox="0 0 34 10">
        <Circle cx={4} cy={5} r={1.6} fill={color} opacity={0.7} />
        <Path d="M17 0 L22 5 L17 10 L12 5 Z" fill={color} />
        <Circle cx={30} cy={5} r={1.6} fill={color} opacity={0.7} />
      </Svg>
      <View style={[styles.rule, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 6 },
  rule: { flex: 1, height: 1, opacity: 0.35 },
});
