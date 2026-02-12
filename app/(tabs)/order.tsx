import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { LINKS } from "@/src/constants/links";
import { GeckosColors } from "@/src/theme/colors";

// Force mobile Safari user agent so the Heartland POS ordering site
// serves its mobile version in the WebView (iPhone path).
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const IS_IPAD = Platform.OS === "ios" && Platform.isPad;
const PHONE_DISPLAY = "580-564-9599";

export default function OrderScreen() {
  const ORDER_URL = LINKS.ORDER_ONLINE;
  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(!IS_IPAD);
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
    timeoutRef.current = setTimeout(() => {
      setLoadTimeout(true);
      setIsLoading(false);
    }, 12000);
  };

  useEffect(() => {
    if (!IS_IPAD) {
      startLoadingTimeout();
    }
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

  const handleContentProcessTerminate = () => {
    webViewRef.current?.reload();
  };

  const handleRefresh = () => {
    setHasError(false);
    setLoadTimeout(false);
    setIsLoading(true);
    startLoadingTimeout();
    webViewRef.current?.reload();
  };

  const handleCallToOrder = () => {
    Alert.alert("Call Gecko's", PHONE_DISPLAY, [{ text: "OK" }]);
  };

  // iPad: the Heartland POS ordering site is not compatible with iPadOS.
  // Show a functional order screen with call-to-order.
  if (IS_IPAD) {
    return (
      <>
        <StatusBar style="dark" />
        <AppContainer
          noPadding={false}
          noBottomSafeArea
          safeBackgroundColor="#fff"
          containerBackgroundColor="#fff"
        >
          <View style={styles.iPadContainer}>
            <Ionicons name="receipt-outline" size={64} color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.iPadTitle}>Place an Order</GeckosText>
            <GeckosText style={styles.iPadBody}>
              Call us to place your order for pickup or delivery.
            </GeckosText>

            <Pressable
              onPress={handleCallToOrder}
              style={({ pressed }) => [
                styles.iPadButton,
                pressed && styles.iPadButtonPressed,
              ]}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <GeckosText style={styles.iPadButtonText}>
                Call {PHONE_DISPLAY}
              </GeckosText>
            </Pressable>

            <GeckosText style={styles.iPadHint}>
              Online ordering is available on iPhone.
            </GeckosText>
          </View>
        </AppContainer>
      </>
    );
  }

  // iPhone: use inline WebView
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
          userAgent={MOBILE_USER_AGENT}
          contentMode="mobile"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleError}
          onContentProcessDidTerminate={handleContentProcessTerminate}
          renderError={() => null}
          renderLoading={() => null}
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          allowsInlineMediaPlayback={true}
          sharedCookiesEnabled={true}
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
  // iPad-specific styles
  iPadContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iPadTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  iPadBody: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  iPadButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: GeckosColors.geckoGreen,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  iPadButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  iPadButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  iPadHint: {
    marginTop: 20,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});