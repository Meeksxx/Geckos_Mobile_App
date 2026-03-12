// src/hooks/usePushNotifications.ts
// Registers the device for Expo push notifications and stores the token in
// Supabase so staff can send announcements to all app users.
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";

const PROJECT_ID = "0e588ad7-be33-486f-a079-90c3e44e3f14";

// Show notifications as banners while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerToken(userId: string | null) {
  // Physical device required — simulators/emulators can't receive push notifications.
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  // Android needs a notification channel.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Gecko's Announcements",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
  const token = tokenData.data;

  await supabase.from("push_tokens").upsert(
    { token, user_id: userId ?? null, platform: Platform.OS },
    { onConflict: "token" }
  );
}

export function usePushNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    void registerToken(userId);
  }, [userId]);
}
