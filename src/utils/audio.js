import * as FileSystem from "expo-file-system";

/**
 * Saves a base64-encoded MP3 string to the device filesystem
 * and returns the file:// URI for expo-av playback.
 */
export async function saveAudioFile(base64Data, filename = "story.mp3") {
  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}
