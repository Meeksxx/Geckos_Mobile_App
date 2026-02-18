import React, { useEffect, useRef, useState } from "react";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Animated, Image, StyleSheet, View } from "react-native";

import { GeckosColors } from "@/src/theme/colors";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const pathname = usePathname();
  const isKitchenRoute = pathname === "/kitchen";
  const [showLaunch, setShowLaunch] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isKitchenRoute) {
      setShowLaunch(false);
      return;
    }

    // Hold the launch screen for a moment so it is visible in Expo Go.
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setShowLaunch(false));
    }, 2600);

    return () => clearTimeout(timer);
  }, [isKitchenRoute, opacity]);

  return (
    <AuthProvider>
    <CartProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="kitchen" />
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
          </Animated.View>
        )}
      </View>
    </CartProvider>
    </AuthProvider>
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
