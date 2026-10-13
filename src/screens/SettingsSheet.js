import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import appConfig from "../../app.json";

import AgeSegmented from "../components/AgeSegmented";
import KidAvatar from "../components/KidAvatar";
import { CloseIcon, PlusIcon } from "../components/Icons";
import { useProfiles } from "../state/ProfileContext";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

function KidRow({ kid, isActive, canRemove, onSelect, onChange, onRemove, autoFocus }) {
  return (
    <View style={[styles.kidCard, isActive && styles.kidCardActive]}>
      <View style={styles.kidTop}>
        <Pressable
          onPress={onSelect}
          style={styles.radio}
          hitSlop={8}
          accessibilityRole="radio"
          accessibilityState={{ checked: isActive }}
          accessibilityLabel={`Tonight's stories are for ${kid.name || "this child"}`}
        >
          <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
            {isActive ? <View style={styles.radioInner} /> : null}
          </View>
        </Pressable>
        <KidAvatar kid={kid} size={34} />
        <TextInput
          value={kid.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="Child's name"
          placeholderTextColor={colors.textTertiary}
          style={styles.nameInput}
          autoFocus={autoFocus}
          maxLength={24}
          autoCapitalize="words"
          returnKeyType="done"
          accessibilityLabel="Child's name"
        />
        {canRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn} accessibilityRole="button" accessibilityLabel={`Remove ${kid.name || "child"}`}>
            <CloseIcon size={14} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      <AgeSegmented value={kid.ageRange} onChange={(ageRange) => onChange({ ageRange })} />
    </View>
  );
}

export default function SettingsSheet({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { kids, activeKid, addKid, updateKid, removeKid, setActiveKid, prefs, setPref } = useProfiles();
  const [newKidId, setNewKidId] = useState(null);

  const handleAdd = () => {
    const id = addKid({ name: "", ageRange: activeKid?.ageRange });
    setNewKidId(id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close settings" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Your family
            </Text>
            <Pressable onPress={onClose} style={styles.doneBtn} accessibilityRole="button">
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Who's listening tonight?</Text>
            <View style={{ gap: 10 }} accessibilityRole="radiogroup">
              {kids.map((kid) => (
                <KidRow
                  key={kid.id}
                  kid={kid}
                  isActive={kid.id === activeKid?.id}
                  canRemove={kids.length > 1}
                  autoFocus={kid.id === newKidId}
                  onSelect={() => setActiveKid(kid.id)}
                  onChange={(patch) => updateKid(kid.id, patch)}
                  onRemove={() => removeKid(kid.id)}
                />
              ))}
            </View>
            {kids.length < 6 ? (
              <Pressable onPress={handleAdd} style={styles.addBtn} accessibilityRole="button">
                <PlusIcon size={16} color={colors.gold} />
                <Text style={styles.addText}>Add another child</Text>
              </Pressable>
            ) : null}
            <Text style={styles.help}>Each child gets stories written for their age.</Text>

            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Stories per night</Text>
            <View style={styles.countRow}>
              {[1, 2, 3].map((n) => {
                const active = prefs.storiesPerNight === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setPref("storiesPerNight", n)}
                    style={[styles.countPill, active && styles.countPillActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                  >
                    <Text style={[styles.countText, active && styles.countTextActive]}>
                      {n} {n === 1 ? "story" : "stories"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.help}>After the last one, the app goes quiet and shows a goodnight screen.</Text>

            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>About</Text>
            <Text style={styles.about}>
              Bollywood Bedtime tells gentle, child-friendly retellings inspired by much-loved Indian films — no
              scary villains, no violence, and every story ends sleepy. We're not affiliated with the films or
              their studios.
            </Text>
            <Text style={styles.version}>Version {appConfig.expo.version}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "90%",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "#140d2c",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.goldLight },
  doneBtn: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center" },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.gold },
  body: { paddingHorizontal: 22, paddingBottom: 12 },

  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.textTertiary,
    marginBottom: 10,
    marginTop: 8,
  },
  help: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textTertiary, marginTop: 10 },

  kidCard: {
    padding: 14,
    borderRadius: 18,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  kidCardActive: { borderColor: colors.gold, backgroundColor: "rgba(246,166,35,0.08)" },
  kidTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textTertiary, alignItems: "center", justifyContent: "center" },
  radioOuterActive: { borderColor: colors.gold },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  nameInput: {
    flex: 1,
    minHeight: 40,
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.white,
    outlineStyle: "none",
  },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, marginTop: 6 },
  addText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.gold },

  countRow: { flexDirection: "row", gap: 8 },
  countPill: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  countPillActive: { backgroundColor: colors.gold },
  countText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  countTextActive: { color: colors.onGold },

  about: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  version: { fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary, marginTop: 10 },
});
