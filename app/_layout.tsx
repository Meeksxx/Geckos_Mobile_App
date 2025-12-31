import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// ✅ Keep the native splash visible until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }, 1200);

    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item" options={{ presentation: "modal" }} />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}
