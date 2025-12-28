import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StyleSheet, View } from "react-native";

export default function RewardsScreen() {
  return (
    <AppContainer>
      <View style={styles.center}>
        <GeckosText variant="title">Rewards</GeckosText>
        <GeckosText variant="muted">
          Points, offers, and loyalty perks coming soon.
        </GeckosText>

        <View style={styles.spacer} />

        <PrimaryButton label="Join Rewards" onPress={() => console.log("Join Rewards")} />
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
