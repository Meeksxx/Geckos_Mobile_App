import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { GeckosColors } from "@/src/theme/colors";
import { GeckosText } from "@/src/components/GeckosText";

type GeckosHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function GeckosHeader({ title, subtitle, showBack = false }: GeckosHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left cluster: back + logo */}
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <GeckosText style={styles.backIcon}>‹</GeckosText>
          </Pressable>
        ) : null}

        <Image
          source={require("@/assets/images/logo/gecko.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Center: title/subtitle */}
      <View style={styles.center}>
        <GeckosText variant="title" style={styles.title}>
          {title}
        </GeckosText>

        {subtitle ? (
          <GeckosText variant="muted" style={styles.subtitle}>
            {subtitle}
          </GeckosText>
        ) : null}
      </View>

      {/* Right spacer so center truly centers */}
      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: GeckosColors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GeckosColors.border,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    width: 90, // reserved space so center stays centered
  },

  backButton: {
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  backIcon: {
    fontSize: 34,
    lineHeight: 34,
    color: GeckosColors.text,
    marginTop: -2,
  },

  logo: {
    width: 28,
    height: 28,
  },

  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  title: {
    fontSize: 18,
    color: GeckosColors.geckoGreen,
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 2,
    textAlign: "center",
  },

  rightSpacer: {
    width: 90, // matches left width
  },
});
