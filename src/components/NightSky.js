import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

function Star({ size, top, left, baseOpacity, duration, delay }) {
  const opacity = useSharedValue(baseOpacity * 0.4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseOpacity, { duration: duration / 2 }),
          withTiming(baseOpacity * 0.3, { duration: duration / 2 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "white",
          top: `${top}%`,
          left: `${left}%`,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function NightSky() {
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      top: Math.random() * 60,
      left: Math.random() * 100,
      baseOpacity: Math.random() * 0.6 + 0.2,
      duration: (Math.random() * 3 + 2) * 1000,
      delay: Math.random() * 5000,
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
}
