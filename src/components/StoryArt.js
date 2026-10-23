import { useState } from "react";
import { Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MoonIcon } from "./Icons";
import { colors } from "../constants/colors";

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
    <LinearGradient colors={[colors.night500, colors.night800]} style={[styles.fill, styles.fallback, style]}>
      <MoonIcon size={emojiSize} color={colors.marigoldSoft} />
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
