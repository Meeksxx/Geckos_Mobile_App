import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
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
