import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { LINKS } from "@/src/constants/links";

export default function OrderScreen() {
  const ORDER_URL = LINKS.ORDER_ONLINE;

  return (
    <AppContainer noPadding noBottomSafeArea>
      <View style={styles.header}>
        <GeckosText style={styles.headerTitle}>Order Online</GeckosText>
      </View>

      <WebView
        source={{ uri: ORDER_URL }}
        style={styles.webview}
        startInLoadingState
      />
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  webview: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
});
