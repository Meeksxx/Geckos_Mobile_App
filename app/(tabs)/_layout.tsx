import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { GeckosColors } from "@/src/theme/colors";
import { GeckosText } from "@/src/components/GeckosText";
import { useCart } from "@/src/context/CartContext";

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={badgeStyles.badge}>
      <GeckosText style={badgeStyles.text}>
        {count > 99 ? "99+" : count}
      </GeckosText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GeckosColors.geckoGreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
});

export default function TabLayout() {
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: GeckosColors.background,
          borderTopColor: GeckosColors.border,
        },

        tabBarActiveTintColor: GeckosColors.geckoGreen,
        tabBarInactiveTintColor: GeckosColors.mutedText,

        tabBarLabelStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="order"
        options={{
          title: "Order",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="receipt" size={size} color={color} />
              <CartBadge count={itemCount} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
