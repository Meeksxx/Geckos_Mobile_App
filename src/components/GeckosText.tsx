import { Text, TextProps, StyleSheet } from "react-native";
import { GeckosColors } from "@/src/theme/colors";

type GeckosTextProps = TextProps & {
  variant?: "title" | "subtitle" | "body" | "muted";
};

export function GeckosText({
  variant = "body",
  style,
  ...props
}: GeckosTextProps) {
  return <Text style={[styles.base, styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    color: GeckosColors.text,
  },
  title: {
    fontSize: 44,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: GeckosColors.mutedText,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
  },
  muted: {
    fontSize: 14,
    color: GeckosColors.mutedText,
  },
});
