import React, { useEffect, useRef, useState } from "react";
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

  const startLoadingTimeout = () => {
    clearLoadingTimeout();
    // Set a 12-second timeout for loading (reduced for reviewers)
    timeoutRef.current = setTimeout(() => {
      setLoadTimeout(true);
      setIsLoading(false);
    }, 12000);
  };

  // Start timeout on mount (handles cases where onLoadStart doesn't fire)
  useEffect(() => {
    startLoadingTimeout();
    return () => clearLoadingTimeout();
  }, []);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    setLoadTimeout(false);
    startLoadingTimeout();
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

  const handleRefresh = () => {
    setHasError(false);
    setLoadTimeout(false);
    setIsLoading(true);
    startLoadingTimeout();
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
        {/* Always-visible refresh header */}
        <View style={styles.header}>
          <GeckosText style={styles.headerTitle}>Order Online</GeckosText>
          <Pressable
            onPress={handleRefresh}
            hitSlop={12}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshButtonPressed,
            ]}
          >
            <Ionicons name="reload" size={20} color="#fff" />
            <GeckosText style={styles.refreshButtonText}>Refresh</GeckosText>
          </Pressable>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: ORDER_URL }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleError}
          renderError={() => null}
          renderLoading={() => null}
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          // Add additional safeguards
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
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
              onPress={handleRefresh}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: GeckosColors.geckoGreen,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  refreshButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
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
    zIndex: 999,
    elevation: 999,
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
