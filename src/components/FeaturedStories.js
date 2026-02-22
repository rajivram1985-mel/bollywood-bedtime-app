import { useState, useEffect, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PREBUILT_STORIES } from "../constants/prebuiltStories";
import { fetchAllPosters } from "../utils/tmdb";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

// ─── Movie metadata ────────────────────────────────────────────────────────────
const MOVIE_METADATA = {
  "DDLJ":               { searchTitle: "Dilwale Dulhania Le Jayenge", year: 1995, emoji: "🚂" },
  "Sholay":             { searchTitle: "Sholay",                       year: 1975, emoji: "🏜️" },
  "3 Idiots":           { searchTitle: "3 Idiots",                     year: 2009, emoji: "🎓" },
  "Kuch Kuch Hota Hai": { searchTitle: "Kuch Kuch Hota Hai",           year: 1998, emoji: "💫" },
  "Lagaan":             { searchTitle: "Lagaan",                       year: 2001, emoji: "🏏" },
  "Taare Zameen Par":   { searchTitle: "Taare Zameen Par",             year: 2007, emoji: "🎨" },
  "Dangal":             { searchTitle: "Dangal",                       year: 2016, emoji: "🤼" },
  "Bajrangi Bhaijaan":  { searchTitle: "Bajrangi Bhaijaan",            year: 2015, emoji: "🙏" },
  "Pathaan":            { searchTitle: "Pathaan",                      year: 2023, emoji: "🕵️" },
  "Jawan":              { searchTitle: "Jawan",                        year: 2023, emoji: "👮" },
};

// ─── Genre tabs ────────────────────────────────────────────────────────────────
const GENRE_SECTIONS = [
  { key: "classics", label: "Timeless Classics", emoji: "🏆", movies: ["DDLJ", "Sholay", "Kuch Kuch Hota Hai", "Lagaan"] },
  { key: "drama",    label: "Heart & Drama",      emoji: "💛", movies: ["3 Idiots", "Taare Zameen Par", "Dangal", "Bajrangi Bhaijaan"] },
  { key: "action",   label: "Action & Thrills",   emoji: "⚡", movies: ["Pathaan", "Jawan"] },
];

// ─── Poster card ───────────────────────────────────────────────────────────────
function PosterCard({ story, meta, posterUrl, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const showImage = posterUrl && !imgError;

  return (
    <Pressable
      onPress={() => onSelect(story)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {showImage ? (
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <LinearGradient
          colors={["rgba(80,40,120,0.9)", "rgba(20,10,40,0.95)"]}
          style={[StyleSheet.absoluteFill, styles.fallback]}
        >
          <Text style={styles.fallbackEmoji}>{meta?.emoji ?? "🎬"}</Text>
        </LinearGradient>
      )}
      <LinearGradient
        colors={["transparent", "rgba(5,2,15,0.98)"]}
        style={styles.overlay}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{story.movieName}</Text>
        <View style={styles.playBadge}>
          <Text style={styles.playBadgeText}>▶  Play</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FeaturedStories({ onSelect }) {
  const [activeKey, setActiveKey] = useState(GENRE_SECTIONS[0].key);
  const [posters, setPosters] = useState({});

  useEffect(() => {
    fetchAllPosters(MOVIE_METADATA).then(setPosters).catch(() => {});
  }, []);

  const storyMap = useMemo(() => {
    const map = {};
    PREBUILT_STORIES.forEach((s) => { map[s.movieName] = s; });
    return map;
  }, []);

  const activeSection = GENRE_SECTIONS.find((s) => s.key === activeKey);
  const activeStories = activeSection?.movies.map((n) => storyMap[n]).filter(Boolean) ?? [];

  if (PREBUILT_STORIES.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Genre tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {GENRE_SECTIONS.map((section) => {
          const active = activeKey === section.key;
          return (
            <Pressable
              key={section.key}
              onPress={() => setActiveKey(section.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {section.emoji}  {section.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Movie poster grid */}
      <View style={styles.grid}>
        {activeStories.map((story) => (
          <PosterCard
            key={story.movieName}
            story={story}
            meta={MOVIE_METADATA[story.movieName]}
            posterUrl={posters[story.movieName]}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tabActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#1a0a00",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Poster card
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    aspectRatio: 2 / 3,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    backgroundColor: "rgba(20,10,40,0.6)",
  },
  cardPressed: {
    opacity: 0.75,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackEmoji: {
    fontSize: 52,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 36,
    gap: 6,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.white,
    lineHeight: 18,
  },
  playBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(246,166,35,0.18)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
  },
  playBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.gold,
  },
});
