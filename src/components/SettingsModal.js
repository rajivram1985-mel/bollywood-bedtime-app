import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function SettingsModal({
  apiKey,
  setApiKey,
  anthropicKey,
  setAnthropicKey,
  voices,
  selectedVoice,
  setSelectedVoice,
  onClose,
  onFetchVoices,
  loadingVoices,
}) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempAnthropicKey, setTempAnthropicKey] = useState(anthropicKey);

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
          <View style={styles.backdrop} />
        </Pressable>

        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>{"\u2699\ufe0f"} Settings</Text>

            {/* ElevenLabs Key */}
            <Text style={styles.label}>ElevenLabs API Key</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={tempKey}
              onChangeText={setTempKey}
              placeholder="sk_..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => {
                setApiKey(tempKey);
                if (tempKey) onFetchVoices(tempKey);
              }}
            >
              <LinearGradient
                colors={[colors.gold, colors.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Save & Load Voices</Text>
              </LinearGradient>
            </Pressable>

            {/* Anthropic Key */}
            <Text style={[styles.label, { marginTop: 24 }]}>
              Anthropic API Key (for story generation)
            </Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={tempAnthropicKey}
              onChangeText={setTempAnthropicKey}
              placeholder="sk-ant-..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={() => setAnthropicKey(tempAnthropicKey)}>
              <LinearGradient
                colors={[colors.purple, colors.purpleDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Save Anthropic Key</Text>
              </LinearGradient>
            </Pressable>

            {loadingVoices && (
              <Text style={styles.loadingText}>Loading voices...</Text>
            )}

            {/* Voice list */}
            {voices.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.label}>Select Voice</Text>
                {voices.map((voice) => {
                  const isSelected =
                    selectedVoice?.voice_id === voice.voice_id;
                  return (
                    <Pressable
                      key={voice.voice_id}
                      onPress={() => setSelectedVoice(voice)}
                      style={[
                        styles.voiceItem,
                        isSelected && styles.voiceItemSelected,
                      ]}
                    >
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      {voice.labels && (
                        <Text style={styles.voiceLabels}>
                          {Object.values(voice.labels)
                            .filter(Boolean)
                            .join(" \u00b7 ")}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Done button */}
            <View style={styles.footer}>
              <Pressable onPress={onClose} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceOverlayDark,
  },
  card: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: colors.panelBgSolid,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.borderGold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.gold,
    marginBottom: 24,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
  },
  input: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderGoldMedium,
    backgroundColor: colors.surfaceInput,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  button: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  buttonText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.white,
  },
  loadingText: {
    color: colors.gold,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 12,
  },
  voiceItem: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceVeryFaint,
    marginBottom: 8,
  },
  voiceItemSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.voiceSelectedBg,
  },
  voiceName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },
  voiceLabels: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: "flex-end",
    marginTop: 24,
  },
  doneButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  doneButtonText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.white,
  },
});
