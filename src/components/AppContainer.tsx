import { GeckosColors } from "@/src/theme/colors";
import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppContainerProps = {
  children: ReactNode;
  noPadding?: boolean;
  noBottomSafeArea?: boolean;

  /**
   * Optional override for the SafeArea background color.
   * Use this when a specific screen (like a WebView) needs a different top safe-area color.
   */
  safeBackgroundColor?: string;

  /**
   * Optional override for the inner container background.
   * Usually you won't need this, but WebView screens sometimes do.
   */
  containerBackgroundColor?: string;

  style?: ViewStyle;
};

export function AppContainer({
  children,
  noPadding = false,
  noBottomSafeArea = false,
  safeBackgroundColor,
  containerBackgroundColor,
  style,
}: AppContainerProps) {
  return (
    <SafeAreaView
      style={[
        styles.safe,
        safeBackgroundColor ? { backgroundColor: safeBackgroundColor } : null,
      ]}
      edges={
        noBottomSafeArea
          ? ["top", "left", "right"]
          : ["top", "bottom", "left", "right"]
      }
    >
      <View
        style={[
          styles.container,
          containerBackgroundColor ? { backgroundColor: containerBackgroundColor } : null,
          noPadding && styles.noPadding,
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  noPadding: {
    padding: 0,
  },
});
