import { StyleSheet, View } from "react-native";
import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";

export default function ItemModal() {
  return (
    <AppContainer>
      <View style={styles.center}>
        <GeckosText variant="title">Item</GeckosText>
        <GeckosText variant="muted">Item details modal coming soon</GeckosText>
      </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
