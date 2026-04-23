import { useState, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PREBUILT_STORIES } from "../constants/prebuiltStories";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

// ─── Movie metadata + original illustrations ───────────────────────────────────
// Illustrations are original artwork (storybook style). Each is themed around
// the FEELING of the film, not the film itself — no licensed characters or
// actor likenesses, so they're safe to scale.
const MOVIE_METADATA = {
  "DDLJ":               { year: 1995, emoji: "🚂", illustration: require("../../assets/illustrations/ddlj.png") },
  "Sholay":             { year: 1975, emoji: "🏜️", illustration: require("../../assets/illustrations/sholay.png") },
  "3 Idiots":           { year: 2009, emoji: "🎓", illustration: require("../../assets/illustrations/3idiots.png") },
  "Kuch Kuch Hota Hai": { year: 1998, emoji: "💫", illustration: require("../../assets/illustrations/kkhh.png") },
  "Lagaan":             { year: 2001, emoji: "🏏", illustration: require("../../assets/illustrations/lagaan.png") },
  "Taare Zameen Par":   { year: 2007, emoji: "🎨", illustration: require("../../assets/illustrations/tzp.png") },
  "Dangal":             { year: 2016, emoji: "🤼", illustration: require("../../assets/illustrations/dangal.png") },
  "Bajrangi Bhaijaan":  { year: 2015, emoji: "🙏", illustration: require("../../assets/illustrations/bajrangi.png") },
  "Pathaan":            { year: 2023, emoji: "🕵️", illustration: require("../../assets/illustrations/pathaan.png") },
  "Jawan":              { year: 2023, emoji: "👮", illustration: require("../../assets/illustrations/jawan.png") },
};

// ─── Genre tabs ────────────────────────────────────────────────────────────────
const GENRE_SECTIONS = [
  { key: "classics", label: "Timeless Classics", emoji: "🏆", movies: ["DDLJ", "Sholay", "Kuch Kuch Hota Hai", "Lagaan"] },
  { key: "drama",    label: "Heart & Drama",      emoji: "💛", movies: ["3 Idiots", "Taare Zameen Par", "Dangal", "Bajrangi Bhaijaan"] },
  { key: "action",   label: "Action & Thrills",   emoji: "⚡", movies: ["Pathaan", "Jawan"] },
];

// Estimate listening minutes from word count.
// TTS at rate 0.78 ≈ 130–140 wpm including pauses.
function estimateMinutes(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  const m = Math.round(words / 140 / 5) * 5;
  return Math.max(5, m);
}

// ─── Poster card ───────────────────────────────────────────────────────────────
function PosterCard({ story, meta, posterUrl, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const localIllustration = meta?.illustration;
  const remoteUrl = posterUrl;
  const showLocal = !!localIllustration && !imgError;
  const showRemote = !showLocal && !!remoteUrl && !imgError;

  const minutes = useMemo(() => estimateMinutes(story.text), [story.text]);

  return (
    <Pressable
      onPress={() => onSelect(story)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {showLocal ? (
        <Image
          source={localIllustration}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : showRemote ? (
        <Image
          source={{ uri: remoteUrl }}
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
        colors={["transparent", "rgba(5,2,15,0.55)", "rgba(5,2,15,0.98)"]}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {story.movieName}
          {meta?.year ? <Text style={styles.cardYear}>  {meta.year}</Text> : null}
        </Text>
        <View style={styles.metaRow}>
          {minutes ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>⏱ {minutes} min</Text>
            </View>
          ) : null}
          {story.ageRange ? (
            <View style={[styles.metaPill, styles.metaPillAge]}>
              <Text style={[styles.metaPillText, styles.metaPillTextAge]}>
                Ages {story.ageRange}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.playBadge}>
          <Text style={styles.playBadgeText}>▶  Play</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const MY_STORIES_KEY = "my-stories";

// ─── Main component ────────────────────────────────────────────────────────────
export default function FeaturedStories({ onSelect, generatedStories = [], onDeleteGenerated }) {
  const [activeKey, setActiveKey] = useState(GENRE_SECTIONS[0].key);

  const storyMap = useMemo(() => {
    const map = {};
    PREBUILT_STORIES.forEach((s) => { map[s.movieName] = s; });
    return map;
  }, []);

  const isMyStories = activeKey === MY_STORIES_KEY;
  const activeSection = GENRE_SECTIONS.find((s) => s.key === activeKey);
  const activeStories = isMyStories
    ? generatedStories
    : (activeSection?.movies.map((n) => storyMap[n]).filter(Boolean) ?? []);

  if (PREBUILT_STORIES.length === 0) return null;

  const allTabs = [
    ...GENRE_SECTIONS,
    ...(generatedStories.length > 0
      ? [{ key: MY_STORIES_KEY, label: "My Stories", emoji: "📖" }]
      : []),
  ];

  return (
    <View style={styles.container}>
      {/* Section heading — film grid is the hero */}
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>🎬 Tonight's stories</Text>
        <Text style={styles.headingSubtitle}>
          Pick a film and we'll read it as a calming bedtime tale
        </Text>
      </View>

      {/* Tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {allTabs.map((section) => {
          const active = activeKey === section.key;
          const isMyTab = section.key === MY_STORIES_KEY;
          return (
            <Pressable
              key={section.key}
              onPress={() => setActiveKey(section.key)}
              style={[styles.tab, active && styles.tabActive, isMyTab && !active && styles.tabMine]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {section.emoji}  {section.label}
                {isMyTab && ` (${generatedStories.length})`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Movie poster grid */}
      <View style={styles.grid}>
        {activeStories.map((story) => (
          <View key={story.movieName} style={styles.cardWrapper}>
            <PosterCard
              story={story}
              meta={MOVIE_METADATA[story.movieName] ?? { emoji: "🎬" }}
              posterUrl={isMyStories ? story.posterUrl : null}
              onSelect={onSelect}
            />
            {isMyStories && (
              <Pressable
                onPress={() => onDeleteGenerated?.(story.movieName)}
                style={styles.deleteBtn}
                hitSlop={6}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {isMyStories && generatedStories.length === 0 && (
        <Text style={styles.emptyText}>No saved stories yet. Generate one below!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  // Heading
  heading: {
    marginBottom: 4,
    gap: 4,
  },
  headingTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.goldLight,
  },
  headingSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 19,
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

  // My Stories tab variant
  tabMine: {
    borderColor: "rgba(150,100,255,0.4)",
    backgroundColor: "rgba(150,100,255,0.07)",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  // Card wrapper (for positioning the delete button)
  cardWrapper: {
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: 280,
    position: "relative",
  },

  // Delete button (My Stories tab only)
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  deleteBtnText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
  },

  // Empty state
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
    paddingVertical: 20,
  },

  // Poster card
  card: {
    width: "100%",
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 56,
    gap: 8,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.white,
    lineHeight: 19,
  },
  cardYear: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  metaPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
  },
  metaPillAge: {
    backgroundColor: "rgba(150,100,255,0.18)",
    borderColor: "rgba(150,100,255,0.45)",
  },
  metaPillTextAge: {
    color: "#d6c5ff",
  },
  playBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(246,166,35,0.22)",
    borderWidth: 1,
    borderColor: colors.borderGoldSubtle,
    marginTop: 2,
  },
  playBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.gold,
  },
});
