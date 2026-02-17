import React from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { LINKS } from "@/src/constants/links";
import { GeckosColors } from "@/src/theme/colors";

const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

export default function OrderScreen() {
  const handleCall = () => {
    if (Platform.OS === "ios" && Platform.isPad) {
      Alert.alert("Call Gecko's", PHONE_DISPLAY, [{ text: "OK" }]);
      return;
    }
    Linking.openURL(`tel:${PHONE_DIAL}`);
  };

  const handleOrderOnline = () => {
    WebBrowser.openBrowserAsync(LINKS.ORDER_ONLINE, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Ionicons name="receipt-outline" size={56} color={GeckosColors.geckoGreen} />
          </View>

          <GeckosText style={styles.title}>Place an Order</GeckosText>
          <GeckosText style={styles.body}>
            Order online or give us a call for pickup and delivery.
          </GeckosText>

          <Pressable
            onPress={handleOrderOnline}
            style={({ pressed }) => [
              styles.orderButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="cart-outline" size={20} color={GeckosColors.background} />
            <GeckosText style={styles.orderButtonText}>Order Online</GeckosText>
          </Pressable>

          <GeckosText style={styles.divider}>or</GeckosText>

          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.callButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="call" size={20} color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.callButtonText}>
              Call {PHONE_DISPLAY}
            </GeckosText>
          </Pressable>
        </View>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  orderButton: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  orderButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  divider: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  callButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: GeckosColors.geckoGreen,
  },
  callButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});