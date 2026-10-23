import { useState, useCallback, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NightSky from "../components/NightSky";
import TonightHero from "../components/TonightHero";
import StoryRow from "../components/StoryRow";
import GenerateStory from "../components/GenerateStory";
import ArchFrame from "../components/ArchFrame";
import StoryArt from "../components/StoryArt";
import { Divider } from "../components/Ornament";
import { canGenerateStories } from "../utils/api";
import KidAvatar from "../components/KidAvatar";
import { GearIcon, PlayIcon } from "../components/Icons";
import NowPlayingScreen from "./NowPlayingScreen";
import SettingsSheet from "./SettingsSheet";

import { useProfiles } from "../state/ProfileContext";
import { COLLECTIONS, getBundledStories, toGeneratedStory, pickTonight, buildQueue } from "../data/catalog";
import { getJSON, setJSON, STORAGE_KEYS } from "../utils/storage";
import { ageLabel } from "../constants/ageRanges";
import { languageLabel, DEFAULT_LANGUAGE } from "../constants/languages";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

function greetingFor(name) {
  const h = new Date().getHours();
  const hello = h >= 17 || h < 4 ? "Shubh ratri" : "Namaste";
  return name ? `${hello}, ${name}` : hello;
}

// Little ones ask for the same story again and again — make that one tap.
function PlayAgain({ story, onPlay }) {
  return (
    <Pressable
      onPress={() => onPlay(story)}
      style={({ pressed }) => [styles.again, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${story.title} again`}
    >
      <ArchFrame width={40} style={{ height: 52 }} inset={0} bottomRadius={8}>
        <StoryArt story={story} emojiSize={16} />
      </ArchFrame>
      <View style={styles.againText}>
        <Text style={styles.againEyebrow}>Last time</Text>
        <Text style={styles.againTitle} numberOfLines={1}>
          {story.title}
        </Text>
      </View>
      <View style={styles.againBtn}>
        <PlayIcon size={14} color={colors.marigold} />
        <Text style={styles.againBtnText}>Again</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { kids, activeKid, setActiveKid, recentIds } = useProfiles();
  const ageRange = activeKid?.ageRange ?? "6-8";
  const language = activeKid?.language ?? DEFAULT_LANGUAGE;

  const [savedGenerated, setSavedGenerated] = useState([]);
  const [queue, setQueue] = useState(null); // non-null = player open
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    getJSON(STORAGE_KEYS.GENERATED_STORIES, []).then(setSavedGenerated);
  }, []);

  const bundled = useMemo(() => getBundledStories(ageRange, language), [ageRange, language]);
  const generated = useMemo(() => savedGenerated.map(toGeneratedStory), [savedGenerated]);
  const tonight = useMemo(
    () => pickTonight(bundled, { seed: activeKid?.id ?? "", recentIds }),
    // Recompute only when the child or age changes, not after every play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bundled, activeKid?.id]
  );
  const lastStory = useMemo(() => {
    const id = recentIds[0];
    if (!id || id === tonight?.id) return null;
    return bundled.find((s) => s.id === id) ?? generated.find((s) => s.id === id) ?? null;
  }, [recentIds, bundled, generated, tonight]);

  const playBundled = useCallback((story) => setQueue(buildQueue(bundled, story.id)), [bundled]);
  const playGenerated = useCallback(
    (story) => setQueue([story, ...buildQueue(bundled, tonight?.id)]),
    [bundled, tonight]
  );
  const playAny = useCallback((story) => (story.kind === "generated" ? playGenerated(story) : playBundled(story)), [
    playBundled,
    playGenerated,
  ]);

  const handleGenerated = useCallback(
    (saved) => {
      const entry = { ...saved, savedAt: new Date().toISOString() };
      setSavedGenerated((prev) => {
        const next = [entry, ...prev.filter((s) => s.movieName !== saved.movieName)];
        setJSON(STORAGE_KEYS.GENERATED_STORIES, next);
        return next;
      });
      playGenerated(toGeneratedStory(entry));
    },
    [playGenerated]
  );

  const deleteGenerated = useCallback((story) => {
    setSavedGenerated((prev) => {
      const next = prev.filter((s) => s.movieName !== story.movieName);
      setJSON(STORAGE_KEYS.GENERATED_STORIES, next);
      return next;
    });
  }, []);

  const subhead = [`Ages ${ageLabel(ageRange)}`, language !== "en" ? languageLabel(language) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.root}
    >
      <NightSky />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <KidAvatar kid={activeKid} size={46} />
            <View style={styles.headerText}>
              <Text style={styles.greeting} numberOfLines={1}>
                {greetingFor(activeKid?.name)}
              </Text>
              <Text style={styles.subhead}>{subhead}</Text>
            </View>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              style={styles.gearBtn}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Family and settings"
            >
              <GearIcon color={colors.textSecondary} />
            </Pressable>
          </Animated.View>

          {/* Child switcher — only when there's more than one */}
          {kids.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kidRow}>
              {kids.map((k) => {
                const active = k.id === activeKid?.id;
                return (
                  <Pressable
                    key={k.id}
                    onPress={() => setActiveKid(k.id)}
                    style={[styles.kidPill, active && styles.kidPillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Stories for ${k.name || "child"}, ages ${ageLabel(k.ageRange)}`}
                  >
                    <KidAvatar kid={k} size={26} />
                    <Text style={[styles.kidName, active && styles.kidNameActive]}>{k.name || "Little one"}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Animated.View entering={FadeIn.duration(600)} key={`${activeKid?.id}-${language}-${ageRange}`} style={styles.hero}>
            <TonightHero story={tonight} kidName={activeKid?.name} onPlay={playBundled} />
          </Animated.View>

          {lastStory ? <PlayAgain story={lastStory} onPlay={playAny} /> : null}

          <StoryRow title="Made by you" stories={generated} onPlay={playGenerated} onDelete={deleteGenerated} />

          {COLLECTIONS.map((c) => (
            <StoryRow
              key={c.key}
              title={c.title}
              subtitle={c.subtitle}
              stories={bundled.filter((s) => s.collection === c.key)}
              onPlay={playBundled}
            />
          ))}

          {canGenerateStories ? (
            <GenerateStory ageRange={ageRange} language={language} kidName={activeKid?.name} onGenerated={handleGenerated} />
          ) : null}

          <View style={styles.footer}>
            <Divider width={140} />
            <Text style={styles.footnote}>
              Gentle retellings inspired by much-loved Indian films. Not affiliated with the films or their studios.
            </Text>
          </View>
        </View>
      </ScrollView>

      {queue ? <NowPlayingScreen queue={queue} onClose={() => setQueue(null)} /> : null}
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  column: { width: "100%", maxWidth: 960, alignSelf: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 14,
  },
  headerText: { flex: 1, gap: 1 },
  greeting: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 33,
    color: colors.cream,
  },
  subhead: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.marigoldSoft,
    opacity: 0.85,
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },

  kidRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 6 },
  kidPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingLeft: 6,
    paddingRight: 16,
    borderRadius: 20,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  kidPillActive: { borderColor: colors.marigold, backgroundColor: "rgba(245,165,36,0.14)" },
  kidName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textSecondary },
  kidNameActive: { color: colors.marigoldSoft },

  hero: { marginTop: 18 },

  again: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginTop: 28,
    padding: 10,
    paddingRight: 12,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    maxWidth: 520,
  },
  againText: { flex: 1 },
  againEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
  },
  againTitle: { fontFamily: fonts.headingMedium, fontSize: 17, lineHeight: 22, color: colors.cream },
  againBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
  },
  againBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.marigold },

  footer: { marginTop: 44, gap: 14, alignItems: "center" },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
