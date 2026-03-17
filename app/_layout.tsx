import React, { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { UserProvider, UserContext } from "../context/UserContext";
import { getUser } from '../utils/storage';
import { OnboardingProvider } from "../context/OnboardingContext";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

function LayoutInner() {
  const [fontsLoaded] = useFonts({ Anton: Anton_400Regular });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"  />
    </Stack>
  );
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <OnboardingProvider>
        <SafeAreaProvider>
          <UserProvider>
            <LayoutInner />
          </UserProvider>
        </SafeAreaProvider>
      </OnboardingProvider>
    </ConvexProvider>
  );
}
