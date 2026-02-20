import { Platform } from "react-native";
import Constants from "expo-constants";

// When running on a physical device via Expo Go, use the dev machine's LAN IP.
// The Expo manifest provides this as the debuggerHost (e.g. "192.168.1.86:8081").
// On Android emulator, 10.0.2.2 maps to the host machine's localhost.
// On iOS simulator, localhost works directly.
function getApiHost() {
  const debuggerHost = Constants.expoConfig?.hostUri
    ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
    ?? Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    // debuggerHost is "192.168.1.86:8081" — strip the port
    return debuggerHost.split(":")[0];
  }

  // Fallback
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
}

export const API_BASE_URL = `http://${getApiHost()}:3001`;
