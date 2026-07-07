import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { StyleSheet, View } from "react-native";

import { GeckosColors } from "@/src/theme/colors";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { MenuProvider } from "@/src/context/MenuContext";
import StripeWrapper from "@/src/components/StripeWrapper";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { CartToast } from "@/src/components/CartToast";
import { NotificationPrompt } from "@/src/components/NotificationPrompt";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

export const unstable_settings = {
  anchor: "(tabs)",
};

function PushRegistrar() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <StripeWrapper>
    <AuthProvider>
    <PushRegistrar />
    <MenuProvider>
    <CartProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item" options={{ presentation: "modal" }} />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
          <Stack.Screen name="kitchen" options={{ animation: "fade", animationDuration: 180 }} />
          <Stack.Screen name="content" options={{ animation: "fade", animationDuration: 180 }} />
          <Stack.Screen name="menu-content" options={{ animation: "fade", animationDuration: 180 }} />
        </Stack>

        {/* Keep status bar consistent with dark theme */}
        <StatusBar style="light" />

        {/* Cart toast — lives here so it shows on all screens including category */}
        <CartToast />

        {/* First-launch notification permission prompt */}
        <NotificationPrompt />
      </View>
    </CartProvider>
    </MenuProvider>
    </AuthProvider>
    </StripeWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
});
