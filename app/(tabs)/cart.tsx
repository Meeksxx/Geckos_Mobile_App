import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function CartScreen() {
  return (
    <AppContainer>
      <View style={styles.center}>
        <GeckosText variant="title">Cart</GeckosText>
        <GeckosText variant="muted">Your cart is empty (for now).</GeckosText>

        <View style={styles.spacer} />

        <PrimaryButton label="Browse Menu" onPress={() => router.push("/(tabs)/menu")} />
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
  spacer: {
    height: 16,
  },
});
