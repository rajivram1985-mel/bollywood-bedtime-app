import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { colors } from "../constants/colors";

// A quiet sky: a few small warm stars that breathe slowly. Kept sparse on
// purpose — busy twinkling is the opposite of what bedtime needs.

function Star({ size, top, left, baseOpacity, duration, delay }) {
  const opacity = useSharedValue(baseOpacity * 0.5);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(baseOpacity * 0.35, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.star,
        { width: size, height: size, borderRadius: size / 2, top: `${top}%`, left: `${left}%` },
        animatedStyle,
      ]}
    />
  );
}

export default function NightSky({ count = 26, maxTop = 55 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        size: Math.random() * 1.6 + 1,
        top: Math.random() * maxTop,
        left: Math.random() * 100,
        baseOpacity: Math.random() * 0.45 + 0.15,
        duration: (Math.random() * 4 + 5) * 1000,
        delay: Math.random() * 6000,
      })),
    [count, maxTop]
  );

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    backgroundColor: colors.cream,
  },
});
