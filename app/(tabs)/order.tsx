import React from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

import { AppContainer } from "@/src/components/AppContainer";
import { LINKS } from "@/src/constants/links";

export default function OrderScreen() {
  const ORDER_URL = LINKS.ORDER_ONLINE;

  return (
    <>
      <StatusBar style="dark" />

      <AppContainer
        noPadding
        noBottomSafeArea
        safeBackgroundColor="#fff"
        containerBackgroundColor="#fff"
      >
        <WebView
          source={{ uri: ORDER_URL }}
          style={styles.webview}
          startInLoadingState
          bounces={false}
          contentInsetAdjustmentBehavior="never"
        />
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
