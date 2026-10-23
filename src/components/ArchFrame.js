import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

// A jharokha — the arched palace window — holding a story's artwork, with a
// thin painted inner border like the frame of a miniature painting.
//
// The arch radius is half the frame's width, so it needs the width: pass
// `width` when it's known (cards) or let onLayout measure it (hero, player).
export default function ArchFrame({ width, style, children, inset = 6, bottomRadius = 18, glow = false }) {
  const [measured, setMeasured] = useState(0);
  const w = width ?? measured;
  const r = w / 2;
  const innerR = Math.max(0, r - inset);
  const innerBottom = Math.max(0, bottomRadius - inset);

  return (
    <View
      onLayout={width ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      style={[
        styles.frame,
        glow && styles.glow,
        {
          borderTopLeftRadius: r,
          borderTopRightRadius: r,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
        },
        width ? { width } : null,
        style,
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          {
            borderTopLeftRadius: r,
            borderTopRightRadius: r,
            borderBottomLeftRadius: bottomRadius,
            borderBottomRightRadius: bottomRadius,
          },
        ]}
      >
        {children}
      </View>
      {inset && w > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.inset,
            {
              top: inset,
              left: inset,
              right: inset,
              bottom: inset,
              borderTopLeftRadius: innerR,
              borderTopRightRadius: innerR,
              borderBottomLeftRadius: innerBottom,
              borderBottomRightRadius: innerBottom,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  clip: {
    overflow: "hidden",
  },
  inset: {
    position: "absolute",
    borderWidth: 1,
    borderColor: colors.frameInset,
  },
  glow: {
    shadowColor: colors.marigold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 10,
  },
});
