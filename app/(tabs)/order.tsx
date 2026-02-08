import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { LINKS } from "@/src/constants/links";
import { GeckosColors } from "@/src/theme/colors";

export default function OrderScreen() {
  const ORDER_URL = LINKS.ORDER_ONLINE;
  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const clearLoadingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    setLoadTimeout(false);
    clearLoadingTimeout();

    // Set a 12-second timeout for loading (reduced for reviewers)
    timeoutRef.current = setTimeout(() => {
      setLoadTimeout(true);
      setIsLoading(false);
    }, 12000);
  };

  const handleLoadEnd = () => {
    clearLoadingTimeout();
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    clearLoadingTimeout();
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setLoadTimeout(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

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
          ref={webViewRef}
          source={{ uri: ORDER_URL }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleError}
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          // Add additional safeguards
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />

        {/* Loading Indicator */}
        {isLoading && !hasError && !loadTimeout && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.loadingText}>Loading order page...</GeckosText>
          </View>
        )}

        {/* Error State */}
        {(hasError || loadTimeout) && (
          <View style={styles.overlay}>
            <Ionicons name="alert-circle-outline" size={64} color="#999" />
            <GeckosText style={styles.errorTitle}>
              {loadTimeout ? "Connection Timeout" : "Unable to Load"}
            </GeckosText>
            <GeckosText style={styles.errorMessage}>
              {loadTimeout
                ? "The ordering page is taking too long to load."
                : "There was a problem loading the ordering page."}
            </GeckosText>
            <GeckosText style={styles.errorHint}>
              Please check your internet connection and try again.
            </GeckosText>

            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Ionicons name="reload" size={20} color="#fff" />
              <GeckosText style={styles.retryButtonText}>Retry</GeckosText>
            </Pressable>
          </View>
        )}
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorHint: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GeckosColors.geckoGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
