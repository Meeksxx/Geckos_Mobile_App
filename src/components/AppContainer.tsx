import { GeckosColors } from "@/src/theme/colors";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppContainerProps = {
  children: ReactNode;
  noPadding?: boolean;
  noBottomSafeArea?: boolean;
};

export function AppContainer({
  children,
  noPadding = false,
  noBottomSafeArea = false,
}: AppContainerProps) {
  return (
    <SafeAreaView
      style={styles.safe}
      edges={noBottomSafeArea ? ["top", "left", "right"] : ["top", "bottom", "left", "right"]}
    >
      <View style={[styles.container, noPadding && styles.noPadding]}>{children}</View>
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
