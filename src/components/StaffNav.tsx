// Shared navigation bar shown at the top of every staff dashboard.
// Lets staff quickly switch between dashboards and the customer app.
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { GeckosColors } from "@/src/theme/colors";
import { GeckosText } from "@/src/components/GeckosText";

type Screen = "kitchen" | "menu" | "content" | "app";

const ITEMS: { id: Screen; label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; route: string }[] = [
  { id: "app",     label: "App",       icon: "home-outline",       route: "/(tabs)" },
  { id: "kitchen", label: "Kitchen",   icon: "restaurant-outline", route: "/kitchen" },
  { id: "menu",    label: "Menu",      icon: "grid-outline",       route: "/menu-content" },
  { id: "content", label: "Announcements", icon: "megaphone-outline", route: "/content" },
];

export function StaffNav({ active }: { active: Screen }) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <Pressable
            key={item.id}
            onPress={() => router.replace(item.route as any)}
            style={({ pressed }) => [
              styles.btn,
              isActive && styles.btnActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={isActive ? GeckosColors.geckoGreen : GeckosColors.mutedText}
            />
            <GeckosText
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.label}
            </GeckosText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  btn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
  },
  btnActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textAlign: "center",
  },
  labelActive: {
    color: GeckosColors.geckoGreen,
  },
  pressed: { opacity: 0.75 },
});
