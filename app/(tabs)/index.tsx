import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { GeckosColors } from "@/src/theme/colors";
import { Stack, router } from "expo-router";
import { Image, Linking, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const onCall = () => {
    Linking.openURL("tel:5805649599");
  };

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
        <View style={styles.screen}>
          {/* Big logo stays for now; we’ll rethink after splash */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}

              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.welcomeRow}>
            <Image
              source={require("../../assets/images/logo/gecko.png")}
              style={styles.smallGecko}
              resizeMode="contain"
            />
            <GeckosText style={styles.welcomeText}>
              ¡Hola! Bienvenido a Geckos
            </GeckosText>
          </View>

          <View style={styles.infoBlock}>
            <GeckosText style={styles.infoText}>
              1006 HWY 70 E • Kingston, OK 73439
            </GeckosText>
            <GeckosText style={styles.infoText}>580.564.9599</GeckosText>
          </View>

          <View style={styles.buttonStack}>
            <PrimaryButton
              label="View Menu"
              onPress={() => router.push("/(tabs)/menu")}
            />
            <View style={styles.spacer} />
            <PrimaryButton
              label="Rewards"
              onPress={() => router.push("/(tabs)/rewards")}
            />
            <View style={styles.spacer} />
            <PrimaryButton label="Call Geckos" onPress={onCall} />
          </View>
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

  screen: {
    flex: 1,
    paddingTop: 8,
  },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  logo: {
    width: "100%",
    height: 140,
  },

  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  smallGecko: {
    width: 26,
    height: 26,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text, // ✅ accent-only; keep it light text
  },

  infoBlock: {
    marginTop: 10,
    alignItems: "center",
    gap: 2,
  },
  infoText: {
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },

  buttonStack: {
    marginTop: 22,
    width: "100%",
  },
  spacer: {
    height: 12,
  },
});
