import { useState, useEffect, useCallback } from "react";
import { View, StatusBar } from "react-native";
import { useFonts, Baloo2_600SemiBold, Baloo2_700Bold } from "@expo-google-fonts/baloo-2";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { Audio } from "expo-av";
import HomeScreen from "./src/screens/HomeScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import { getData, setData, STORAGE_KEYS } from "./src/utils/storage";

SplashScreen.preventAutoHideAsync();

// Configure audio for background playback
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const [onboardingDone, setOnboardingDone] = useState(null); // null = still checking

  useEffect(() => {
    getData(STORAGE_KEYS.ONBOARDING_DONE).then((val) => {
      setOnboardingDone(!!val);
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && onboardingDone !== null) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, onboardingDone]);

  // Hold splash until both fonts and storage check are ready
  if (!fontsLoaded || onboardingDone === null) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {onboardingDone ? (
        <HomeScreen
          onResetOnboarding={async () => {
            await setData(STORAGE_KEYS.ONBOARDING_DONE, "");
            setOnboardingDone(false);
          }}
        />
      ) : (
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      )}
    </View>
  );
}
