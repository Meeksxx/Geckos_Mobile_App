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

async function saveToken(userId: string | null) {
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

// Silently registers the token if permission was already granted (returning users).
async function registerIfGranted(userId: string | null) {
  if (!Device.isDevice) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;
  await saveToken(userId);
}

// Called when the user taps "Turn On Notifications" in the prompt.
export async function requestPushPermission(userId: string | null): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;
  await saveToken(userId);
  return true;
}

export function usePushNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    void registerIfGranted(userId);
  }, [userId]);
}
