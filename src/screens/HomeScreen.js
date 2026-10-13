import { useState, useCallback, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NightSky from "../components/NightSky";
import TonightHero from "../components/TonightHero";
import StoryRow from "../components/StoryRow";
import GenerateStory from "../components/GenerateStory";
import KidAvatar from "../components/KidAvatar";
import { GearIcon } from "../components/Icons";
import NowPlayingScreen from "./NowPlayingScreen";
import SettingsSheet from "./SettingsSheet";

import { useProfiles } from "../state/ProfileContext";
import { COLLECTIONS, getBundledStories, toGeneratedStory, pickTonight, buildQueue } from "../data/catalog";
import { getJSON, setJSON, STORAGE_KEYS } from "../utils/storage";
import { ageLabel } from "../constants/ageRanges";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

function greetingFor(name) {
  const evening = new Date().getHours() >= 17 || new Date().getHours() < 4;
  const hello = evening ? "Shubh ratri" : "Namaste";
  return name ? `${hello}, ${name}` : hello;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { kids, activeKid, setActiveKid, recentIds } = useProfiles();
  const ageRange = activeKid?.ageRange ?? "6-8";

  const [savedGenerated, setSavedGenerated] = useState([]);
  const [queue, setQueue] = useState(null); // non-null = player open
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    getJSON(STORAGE_KEYS.GENERATED_STORIES, []).then(setSavedGenerated);
  }, []);

  const bundled = useMemo(() => getBundledStories(ageRange), [ageRange]);
  const generated = useMemo(() => savedGenerated.map(toGeneratedStory), [savedGenerated]);
  const tonight = useMemo(
    () => pickTonight(bundled, { seed: activeKid?.id ?? "", recentIds }),
    // Recompute only when the child or age changes, not after every play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bundled, activeKid?.id]
  );

  const playBundled = useCallback((story) => setQueue(buildQueue(bundled, story.id)), [bundled]);
  const playGenerated = useCallback(
    (story) => setQueue([story, ...buildQueue(bundled, tonight?.id)]),
    [bundled, tonight]
  );

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

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.root}
    >
      <NightSky />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting} numberOfLines={1}>
                {greetingFor(activeKid?.name)} <Text style={styles.moon}>🌙</Text>
              </Text>
              <Text style={styles.subhead}>Bedtime stories for ages {ageLabel(ageRange)}</Text>
            </View>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              style={styles.gearBtn}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Family and settings"
            >
              <GearIcon color={colors.textPrimary} />
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
                    <Text style={[styles.kidAge, active && styles.kidNameActive]}>{ageLabel(k.ageRange)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Animated.View entering={FadeIn.duration(500)} key={activeKid?.id}>
            <TonightHero story={tonight} kidName={activeKid?.name} onPlay={playBundled} />
          </Animated.View>

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

          <GenerateStory ageRange={ageRange} kidName={activeKid?.name} onGenerated={handleGenerated} />

          <Text style={styles.footnote}>
            Gentle retellings inspired by much-loved Indian films. Not affiliated with the films or their studios.
          </Text>
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
    paddingBottom: 18,
    gap: 12,
  },
  headerText: { flex: 1, gap: 2 },
  greeting: {
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    color: colors.goldLight,
  },
  moon: { fontSize: 24 },
  subhead: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  kidRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  kidPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  kidPillActive: { borderColor: colors.gold, backgroundColor: "rgba(246,166,35,0.14)" },
  kidName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textSecondary },
  kidAge: { fontFamily: fonts.body, fontSize: 13, color: colors.textTertiary },
  kidNameActive: { color: colors.goldLight },

  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 32,
  },
});
