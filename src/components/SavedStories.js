import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import { fonts } from "../constants/typography";

export default function SavedStories({ stories, onSelect, onDelete, onClose }) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={onClose}
      >
        <View style={styles.backdrop} />
      </Pressable>

      {/* Panel slides from right */}
      <View style={styles.panel}>
        <LinearGradient
          colors={[colors.savedPanelTop, colors.savedPanelBottom]}
          style={styles.panelGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.heading}>
              {"\ud83d\udcda"} Saved Stories
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{"\u2715"}</Text>
            </Pressable>
          </View>

          {stories.length === 0 ? (
            <Text style={styles.emptyText}>
              No saved stories yet. Generate a story and bookmark it!
            </Text>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
            >
              {stories.map((story, i) => (
                <View key={i} style={styles.storyItem}>
                  <Pressable
                    onPress={() => {
                      onSelect(story);
                      onClose();
                    }}
                    style={styles.storyContent}
                  >
                    <Text style={styles.movieName}>
                      {"\ud83c\udfac"} {story.movieName}
                    </Text>
                    <Text style={styles.savedDate}>
                      Saved{" "}
                      {new Date(story.savedAt).toLocaleDateString()}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(i)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceOverlay,
  },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "85%",
    maxWidth: 400,
  },
  panelGradient: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderGoldSubtle,
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.gold,
  },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 60,
    fontSize: 15,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  storyItem: {
    backgroundColor: colors.surfaceFaint,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,200,100,0.08)",
  },
  storyContent: {
    marginBottom: 8,
  },
  movieName: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.goldLight,
  },
  savedDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: colors.deleteBg,
    borderWidth: 1,
    borderColor: colors.deleteBorder,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    color: colors.deleteText,
    fontSize: 12,
    fontFamily: fonts.body,
  },
});
