import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { GeckosColors } from "@/src/theme/colors";
import { Stack } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

export default function RewardsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTitle: () => (
            <Image
              source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

      <AppContainer>
        <View style={styles.center}>
          <GeckosText variant="title">Rewards</GeckosText>
          <GeckosText variant="muted">
            Points, offers, and loyalty perks coming soon.
          </GeckosText>

          <View style={styles.spacer} />

          <PrimaryButton
            label="Join Rewards"
            onPress={() => console.log("Join Rewards")}
          />
        </View>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    height: 28,
    width: 150,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    height: 16,
  },
});
