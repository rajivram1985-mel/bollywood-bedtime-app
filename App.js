import { useCallback } from "react";
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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <HomeScreen />
    </View>
  );
}
