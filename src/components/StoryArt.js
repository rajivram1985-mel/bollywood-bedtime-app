import { useState } from "react";
import { Image, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Artwork for a story: bundled illustration → remote poster → gradient + emoji.
// Explicit 100% width/height matters on web: react-native-web otherwise sizes
// a required image to its intrinsic pixels (896×1280) and the card crops it.
export default function StoryArt({ story, style, emojiSize = 44 }) {
  const [failed, setFailed] = useState(false);
  const source = story.illustration ?? (story.posterUrl ? { uri: story.posterUrl } : null);

  if (source && !failed) {
    return (
      <Image
        source={source}
        style={[styles.fill, style]}
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <LinearGradient colors={["#4b2a7a", "#1a0f38"]} style={[styles.fill, styles.fallback, style]}>
      <Text style={{ fontSize: emojiSize }}>🌙</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
