import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { GeckosColors } from "@/src/theme/colors";
import { Stack, router } from "expo-router";
import { Image, ImageBackground, Linking, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTitle: () => (
            <Image
              source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

      <AppContainer noPadding noBottomSafeArea>
        <ImageBackground
          source={require("../../assets/home/hero.jpg")} // Your beautiful patio/entrance photo
          style={styles.heroBackground}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            {/* Full Logo */}
            <Image
              source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
              style={styles.heroLogo}
              resizeMode="contain"
            />

            {/* Greeting */}
            <GeckosText style={styles.heroGreeting}>¡Hola!</GeckosText>
            <GeckosText style={styles.heroSubGreeting}>
              Bienvenido a Gecko's
            </GeckosText>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.infoText}>
                  1006 HWY 70 E • Kingston, OK 73439
                </GeckosText>
              </View>

              <Pressable onPress={onCall} style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.infoText}>580.564.9599</GeckosText>
              </Pressable>

              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={20} color={GeckosColors.geckoGreen} />
                <View>
                  <GeckosText style={styles.hoursTitle}>Store Hours</GeckosText>
                  <GeckosText style={styles.hoursText}>Open Daily: 11 AM - 10 PM</GeckosText>
                </View>
              </View>
            </View>

            {/* Professional Buttons */}
            <View style={styles.buttonContainer}>
              <PrimaryButton
                label="View Menu"
                onPress={() => router.push("/(tabs)/menu")}
              />
              <View style={styles.buttonSpacer} />
              <PrimaryButton
                label="Rewards & More"
                onPress={() => router.push("/(tabs)/more")}
              />
              <View style={styles.buttonSpacer} />
              <PrimaryButton label="Call Gecko's" onPress={onCall} />
            </View>
          </View>
        </ImageBackground>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    height: 28,
    width: 150,
  },

  heroBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },

  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  heroLogo: {
    width: 240,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },

  heroGreeting: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1,
  },

  heroSubGreeting: {
    fontSize: 24,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },

  infoCard: {
    backgroundColor: "rgba(20,20,20,0.85)",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 32,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  hoursTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },

  hoursText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ddd",
  },

  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },

  buttonContainer: {
    gap: 14,
    paddingHorizontal: 8,
  },

  buttonSpacer: {
    height: 4,
  },
});