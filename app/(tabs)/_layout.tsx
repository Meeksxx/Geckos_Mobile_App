import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/src/components/haptic-tab';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
  name="index"
  options={{
    title: "Home",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="house.fill" color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="menu"
  options={{
    title: "Menu",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="menucard.fill" color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="rewards"
  options={{
    title: "Rewards",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="star.fill" color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="cart"
  options={{
    title: "Cart",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="cart.fill" color={color} />
    ),
  }}
/>

    </Tabs>
  );
}
