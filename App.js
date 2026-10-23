import { useCallback } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
// Per-weight imports so only these six font files are bundled, not every weight.
import { Baloo2_600SemiBold } from "@expo-google-fonts/baloo-2/600SemiBold";
import { Baloo2_700Bold } from "@expo-google-fonts/baloo-2/700Bold";
import { Nunito_400Regular } from "@expo-google-fonts/nunito/400Regular";
import { Nunito_500Medium } from "@expo-google-fonts/nunito/500Medium";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import * as SplashScreen from "expo-splash-screen";
import { setAudioModeAsync } from "expo-audio";
import HomeScreen from "./src/screens/HomeScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import { ProfileProvider, useProfiles } from "./src/state/ProfileContext";

SplashScreen.preventAutoHideAsync();

// Bedtime audio keeps playing with the screen locked and the ringer switch
// off, and pauses other apps rather than mixing with them.
setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix",
}).catch(() => {});

function Root() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const profiles = useProfiles();
  const ready = fontsLoaded && profiles.loaded;

  const onLayoutRootView = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  // Hold the splash until fonts and saved profiles are ready
  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0C26" }} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {profiles.kids.length > 0 ? <HomeScreen /> : <OnboardingScreen />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <Root />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
