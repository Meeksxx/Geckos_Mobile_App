import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { requestPushPermission } from "@/src/hooks/usePushNotifications";
import { useAuth } from "@/src/context/AuthContext";

const STORAGE_KEY = "geckos_notification_prompt_shown";

export function NotificationPrompt() {
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleEnable = async () => {
    await dismiss();
    await requestPushPermission(session?.user?.id ?? null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications" size={36} color={GeckosColors.geckoGreen} />
          </View>

          <GeckosText style={styles.title}>
            Don't miss out on special offers & events!
          </GeckosText>

          <GeckosText style={styles.body}>
            Enable notifications to stay up to date on Gecko's specials, events, and announcements.
          </GeckosText>

          <Pressable
            onPress={handleEnable}
            style={({ pressed }) => [styles.enableButton, pressed && styles.pressed]}
          >
            <GeckosText style={styles.enableText}>Turn On Notifications</GeckosText>
          </Pressable>

          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [styles.notNowButton, pressed && styles.pressed]}
          >
            <GeckosText style={styles.notNowText}>Not Now</GeckosText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: GeckosColors.background,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  enableButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    alignItems: "center",
    marginBottom: 12,
  },
  enableText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  notNowButton: {
    paddingVertical: 8,
  },
  notNowText: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  pressed: {
    opacity: 0.7,
  },
});
