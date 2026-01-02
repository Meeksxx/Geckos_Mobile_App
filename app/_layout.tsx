import React, { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Animated, Image, StyleSheet, View } from "react-native";

import { GeckosColors } from "@/src/theme/colors";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [showLaunch, setShowLaunch] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hold the launch screen for a moment so it’s actually visible in Expo Go
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setShowLaunch(false));
    }, 2600);

    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item" options={{ presentation: "modal" }} />
      </Stack>

      {/* Keep status bar consistent with dark theme */}
      <StatusBar style="light" />

{/* In-app launch overlay (shows in Expo Go) */}
{showLaunch && (
  <Animated.View style={[styles.launchOverlay, { opacity }]}>
    <Image
      source={require("../assets/images/splash1.png")}
      style={styles.launchLogo}
      resizeMode="contain"
    />

    {/* If you want to use your GeckosText component here later, we can. */}
  </Animated.View>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },

  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0C0F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 9999,
  },

  launchLogo: {
    width: "86%",
    maxWidth: 520,
    height: 320,
    marginBottom: 68,
  },

  launchText: {
    color: "#F2F3F5",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
