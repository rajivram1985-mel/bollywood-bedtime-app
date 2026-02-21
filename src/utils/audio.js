import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

/**
 * Saves a base64-encoded MP3 string and returns a URI for expo-av playback.
 * On web, creates a blob URL. On native, writes to the filesystem.
 */
export async function saveAudioFile(base64Data, filename = "story.mp3") {
  if (Platform.OS === "web") {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    return URL.createObjectURL(blob);
  }

  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}
