import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function HomeScreen() {
  return (
    <AppContainer>
      <View style={styles.center}>
        <GeckosText variant="title">Geckos</GeckosText>
        <GeckosText variant="subtitle">
          Tex-Mex • Order ahead • Pickup & Delivery
        </GeckosText>

        <View style={styles.buttonWrap}>
          <PrimaryButton
            label="View Menu"
            onPress={() => router.push("/(tabs)/menu")}
          />
        </View>
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
  buttonWrap: {
    marginTop: 24,
    width: "100%",
  },
});
