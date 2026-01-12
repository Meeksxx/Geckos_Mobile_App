// app/(tabs)/index.tsx
import React from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { GeckosText } from "@/src/components/GeckosText";

const HEADER_BAR_HEIGHT = 48;

const ADDRESS_LINE = "1006 HWY 70 E • Kingston, OK 73439";
const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

function PillButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: "green" | "tan" | "red";
}) {
  const bg =
    variant === "green"
      ? styles.pillGreen
      : variant === "tan"
      ? styles.pillTan
      : styles.pillRed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, bg, pressed ? styles.pressed : null]}
    >
      <GeckosText style={styles.pillText}>{label}</GeckosText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;

  const onCall = () => Linking.openURL(`tel:${PHONE_DIAL}`);

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ✅ IMPORTANT: do NOT include bottom edge here, Tabs already handles it */}
      <SafeAreaView style={styles.root} edges={["left", "right"]}>
        <ImageBackground
          source={require("../../assets/home/hero.jpg")}
          style={styles.bg}
          resizeMode="cover"
        >
          {/* Overlay layers */}
          <View style={styles.overlayTopDark} />
          <View style={styles.overlayWarmBottom} />

          <View style={[styles.content, { paddingTop: headerBgHeight + 10 }]}>
            {/* Brand */}
            <View style={styles.brandBlock}>
              <Image
                source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Spacer pushes buttons/info down without creating gaps */}
            <View style={{ flex: 1 }} />

            {/* CTAs */}
            <View style={styles.ctaStack}>
              <PillButton
                label="View Menu"
                variant="green"
                onPress={() => router.push("/(tabs)/menu")}
              />
              <PillButton
                label="Order Online"
                variant="tan"
                onPress={() => router.push("/(tabs)/order")}
              />
              <PillButton label="Call Gecko’s" variant="red" onPress={onCall} />
            </View>

            {/* Bottom info */}
            <View
              style={[
                styles.bottomInfo,
                {
                  // small breathing room, NOT a safe-area pad (Tabs already does that)
                  paddingBottom: 10,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#F2E7DA" />
                <GeckosText style={styles.infoText}>{ADDRESS_LINE}</GeckosText>
              </View>

              <Pressable
                onPress={onCall}
                style={({ pressed }) => [styles.infoRow, pressed ? styles.pressed : null]}
              >
                <Ionicons name="call-outline" size={16} color="#F2E7DA" />
                <GeckosText style={styles.infoText}>{PHONE_DISPLAY}</GeckosText>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bg: { flex: 1, width: "100%" },

  overlayTopDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  overlayWarmBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(180, 147, 40, 0.02)",
  },

  content: {
    flex: 1,
    paddingHorizontal: 22,
  },

  brandBlock: {
    alignItems: "center",
    marginTop: 10,
  },

  // ✅ bigger logo like you wanted
  logo: {
    width: 380,
    height: 160,
  },

  ctaStack: {
    gap: 14,
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  pill: {
    width: "100%",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  pillGreen: {
    backgroundColor: "rgba(32, 108, 80, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  pillTan: {
    backgroundColor: "rgba(173, 120, 55, 0.93)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  pillRed: {
    backgroundColor: "rgba(130, 40, 40, 0.93)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  pillText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
    color: "rgba(255,255,255,0.96)",
  },

  bottomInfo: {
    paddingHorizontal: 10,
    gap: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: "rgba(242,231,218,0.95)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  pressed: { opacity: 0.86 },
});
