import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <GeckosText style={styles.title}>Something went wrong</GeckosText>
        <GeckosText style={styles.body}>
          Please close and reopen the app. If the problem persists, contact us at (580) 564-9599.
        </GeckosText>
        <Pressable
          onPress={() => this.setState({ hasError: false })}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <GeckosText style={styles.buttonText}>Try Again</GeckosText>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GeckosColors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  pressed: { opacity: 0.7 },
});
