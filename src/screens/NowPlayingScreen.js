import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Modal, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StoryArt from "../components/StoryArt";
import ArchFrame from "../components/ArchFrame";
import { Divider, Phool } from "../components/Ornament";
import NightSky from "../components/NightSky";
import { PlayIcon, PauseIcon, BackIcon, ForwardIcon, ChevronDownIcon, MoonIcon, BookIcon } from "../components/Icons";
import { usePlayback } from "../player/usePlayback";
import { useProfiles } from "../state/ProfileContext";
import { ageLabel } from "../constants/ageRanges";
import { languageLabel } from "../constants/languages";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

const SKIP_SEC = 15;
const AUTO_DIM_MS = 45000;
const STORY_COUNTS = [1, 2, 3];

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function greeting(name) {
  return name ? `Shubh ratri, ${name}` : "Shubh ratri";
}

export default function NowPlayingScreen({ queue, onClose }) {
  const insets = useSafeAreaInsets();
  const { activeKid, prefs, setPref, recordPlay } = useProfiles();
  const storiesPerNight = prefs.storiesPerNight;

  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [readAlong, setReadAlong] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  // The arch fills the space it's given at a 3:4 ratio, whichever side limits it.
  const artW = Math.min(stage.w, stage.h * 0.76);

  const story = queue[index];
  const playedRef = useRef(played);
  const perNightRef = useRef(storiesPerNight);
  playedRef.current = played;
  perNightRef.current = storiesPerNight;

  const handleFinish = useCallback(() => {
    const n = playedRef.current + 1;
    setPlayed(n);
    if (n >= perNightRef.current || queue.length < 2) {
      setFinished(true);
      setDimmed(false);
      return;
    }
    setIndex((i) => (i + 1) % queue.length);
  }, [queue.length]);

  const player = usePlayback(finished ? null : story, { autoPlay: true, onFinish: handleFinish });

  // History powers "tonight's pick" rotation on the home screen.
  useEffect(() => {
    if (!finished && story) recordPlay(story.id);
  }, [story?.id, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dim: a bright screen is the enemy of sleep. After a quiet spell while
  // a story is playing, fade to near-black; any touch brings it back.
  const dimTimer = useRef(null);
  const wake = useCallback(() => {
    clearTimeout(dimTimer.current);
    dimTimer.current = setTimeout(() => setDimmed(true), AUTO_DIM_MS);
    return false; // never claim the touch — just observe it
  }, []);
  useEffect(() => {
    if (player.isPlaying && !finished) wake();
    else clearTimeout(dimTimer.current);
    return () => clearTimeout(dimTimer.current);
  }, [player.isPlaying, finished, wake]);

  const oneMore = () => {
    setPlayed(Math.max(0, storiesPerNight - 1));
    setIndex((i) => (i + 1) % queue.length);
    setFinished(false);
  };

  const headerLabel =
    storiesPerNight > 1 ? `Story ${Math.min(played + 1, storiesPerNight)} of ${storiesPerNight} tonight` : "Tonight's story";

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <LinearGradient colors={[colors.bgTop, colors.bgMid1, colors.bgMid2, colors.bgBottom]} style={styles.root}>
        <NightSky />
        <View
          style={[styles.safe, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
          onStartShouldSetResponderCapture={wake}
        >
          <View style={styles.column}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Pressable
                onPress={onClose}
                style={styles.iconBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close player"
              >
                <ChevronDownIcon color={colors.textPrimary} />
              </Pressable>
              <View style={styles.topLabelRow}>
                <Phool size={9} />
                <Text style={styles.topLabel}>{headerLabel}</Text>
                <Phool size={9} />
              </View>
              <Pressable
                onPress={() => setDimmed(true)}
                style={styles.iconBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dim the screen"
              >
                <MoonIcon size={20} color={colors.marigoldSoft} />
              </Pressable>
            </View>

            {/* Artwork or read-along text */}
            <View style={styles.stage} onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
              {readAlong ? (
                <ScrollView style={styles.textPanel} contentContainerStyle={styles.textPanelContent}>
                  <Text style={[styles.storyText, story.language === "hi" && styles.storyTextHi]} selectable>
                    {story.text}
                  </Text>
                </ScrollView>
              ) : (
                artW > 0 ? (
                  <ArchFrame width={artW} style={{ height: artW / 0.76, alignSelf: "center" }} glow={player.isPlaying}>
                    <StoryArt story={story} emojiSize={72} />
                  </ArchFrame>
                ) : null
              )}
            </View>

            {/* Title */}
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
                {story.title}
              </Text>
              <Text style={styles.meta}>
                {story.language && story.language !== "en" ? `${languageLabel(story.language)} · ` : ""}
                {story.ageRange ? `Ages ${ageLabel(story.ageRange)} · ` : ""}
                {story.minutes} min · {story.narrated ? "Narrated" : "Read by your device's voice"}
              </Text>
            </View>

            {/* Progress */}
            <View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(1, player.durationSec)}
                value={player.positionSec}
                onSlidingComplete={player.seekTo}
                minimumTrackTintColor={colors.gold}
                maximumTrackTintColor="rgba(255,255,255,0.15)"
                thumbTintColor={colors.goldLight}
                accessibilityLabel="Story progress"
              />
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formatTime(player.positionSec)}</Text>
                <Text style={styles.time}>-{formatTime(player.durationSec - player.positionSec)}</Text>
              </View>
            </View>

            {/* Transport */}
            <View style={styles.transport}>
              <Pressable
                onPress={() => player.seekBy(-SKIP_SEC)}
                style={styles.skipBtn}
                accessibilityRole="button"
                accessibilityLabel="Back 15 seconds"
              >
                <BackIcon size={30} color={colors.textPrimary} />
                <Text style={styles.skipText}>15</Text>
              </Pressable>

              <Pressable
                onPress={player.toggle}
                disabled={player.isLoading}
                accessibilityRole="button"
                accessibilityLabel={player.isPlaying ? "Pause" : "Play"}
                style={({ pressed }) => pressed && { transform: [{ scale: 0.96 }] }}
              >
                <View style={styles.playBtn}>
                  {player.isLoading ? (
                    <ActivityIndicator color={colors.onGold} />
                  ) : player.isPlaying ? (
                    <PauseIcon size={32} color={colors.onGold} />
                  ) : (
                    <PlayIcon size={32} color={colors.onGold} />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => player.seekBy(SKIP_SEC)}
                style={styles.skipBtn}
                accessibilityRole="button"
                accessibilityLabel="Forward 15 seconds"
              >
                <ForwardIcon size={30} color={colors.textPrimary} />
                <Text style={styles.skipText}>15</Text>
              </Pressable>
            </View>

            {player.error ? <Text style={styles.error}>{player.error}</Text> : null}

            {/* Bedtime controls */}
            <View style={styles.bedtimeRow}>
              <Pressable
                onPress={() => setReadAlong((v) => !v)}
                style={[styles.chip, readAlong && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: readAlong }}
                accessibilityLabel="Read along"
              >
                <BookIcon size={16} color={readAlong ? colors.onGold : colors.textPrimary} />
                <Text style={[styles.chipText, readAlong && styles.chipTextActive]}>Read along</Text>
              </Pressable>

              <View style={styles.countGroup} accessibilityRole="radiogroup" accessibilityLabel="Stories tonight">
                <Text style={styles.countLabel}>Stories</Text>
                {STORY_COUNTS.map((n) => {
                  const active = n === storiesPerNight;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setPref("storiesPerNight", n)}
                      style={[styles.countPill, active && styles.chipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${n} ${n === 1 ? "story" : "stories"} tonight`}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Text style={styles.bedtimeHint}>
              {storiesPerNight === 1 ? "After this story" : `After ${storiesPerNight} stories`}, everything goes quiet.
            </Text>
          </View>
        </View>

        {/* Dim overlay — playback continues underneath */}
        {dimmed && !finished ? (
          <Animated.View entering={FadeIn.duration(1200)} exiting={FadeOut.duration(300)} style={StyleSheet.absoluteFill}>
            <Pressable
              style={styles.dim}
              onPress={() => {
                setDimmed(false);
                wake();
              }}
              accessibilityRole="button"
              accessibilityLabel="Screen dimmed. Tap to brighten."
            >
              <MoonIcon size={28} color="rgba(255,207,125,0.3)" />
              <Text style={styles.dimText}>{player.isPlaying ? story.title : "Paused"}</Text>
              <Text style={styles.dimHint}>Tap to brighten</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Goodnight — shown when tonight's stories are done */}
        {finished ? (
          <Animated.View entering={FadeIn.duration(1500)} style={[StyleSheet.absoluteFill, styles.goodnight]}>
            <MoonIcon size={64} color={colors.marigoldSoft} />
            <Text style={styles.gnTitle}>{greeting(activeKid?.name)}</Text>
            <Divider width={120} />
            <Text style={styles.gnBody}>Sweet dreams. That's all the stories for tonight.</Text>
            <View style={styles.gnActions}>
              <Pressable onPress={oneMore} style={styles.gnSecondary} accessibilityRole="button">
                <Text style={styles.gnSecondaryText}>One more story</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.gnSecondary} accessibilityRole="button">
                <Text style={styles.gnSecondaryText}>Close</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  column: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center", gap: 16 },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  topLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  topLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.marigoldSoft,
  },

  stage: { flex: 1, minHeight: 160, justifyContent: "center" },
  textPanel: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  textPanelContent: { padding: 24 },
  storyText: {
    fontFamily: fonts.body,
    fontSize: 19,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  // Devanagari has marks above and below the line, and Nunito has no
  // Devanagari glyphs — use the system Hindi font with more leading.
  storyTextHi: {
    fontFamily: undefined,
    fontSize: 20,
    lineHeight: 38,
  },

  titleBlock: { gap: 4, alignItems: "center" },
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 36, color: colors.cream, textAlign: "center" },
  meta: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textTertiary, textAlign: "center" },

  slider: { width: "100%", height: 32 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -2 },
  time: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textTertiary },

  transport: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40 },
  skipBtn: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  skipText: {
    position: "absolute",
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.textSecondary,
    top: 23,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.marigold,
    shadowColor: colors.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18, color: colors.error, textAlign: "center" },

  bedtimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  chipActive: { backgroundColor: colors.marigold, borderColor: colors.marigold },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  chipTextActive: { color: colors.onGold },
  countGroup: { flexDirection: "row", alignItems: "center", gap: 5 },
  countLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textTertiary, marginRight: 1 },
  countPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  bedtimeHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary, textAlign: "center", marginTop: -6 },

  dim: {
    flex: 1,
    backgroundColor: "rgba(4,3,14,0.96)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  dimText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: "rgba(255,243,222,0.3)" },
  dimHint: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,243,222,0.2)" },

  goodnight: {
    backgroundColor: "rgba(8,7,28,0.97)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  gnTitle: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40, color: colors.cream, textAlign: "center", marginTop: 8 },
  gnBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textTertiary, textAlign: "center" },
  gnActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  gnSecondary: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  gnSecondaryText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
});
