import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function MenuScreen() {
  return (
    <AppContainer>
      <View style={styles.center}>
        <GeckosText variant="title">Menu</GeckosText>
        <GeckosText variant="muted">Coming soon 🌮</GeckosText>

        <View style={styles.spacer} />

        <PrimaryButton label="Open Item Modal" onPress={() => router.push("/item")} />
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
