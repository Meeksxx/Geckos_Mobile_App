import React, { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { GeckosColors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";

type Mode = "signIn" | "signUp" | "forgotPassword";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (mode === "forgotPassword") {
      if (!email.trim()) {
        Alert.alert("Missing Info", "Please enter your email address.");
        return;
      }
      setSubmitting(true);
      const errorMsg = await resetPassword(email.trim());
      setSubmitting(false);
      if (errorMsg) {
        Alert.alert("Error", errorMsg);
        return;
      }
      Alert.alert(
        "Check Your Email",
        "A password reset link has been sent to " + email.trim() + ". Check your inbox.",
        [{ text: "OK", onPress: () => setMode("signIn") }]
      );
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert("Missing Info", "Please enter your email and password.");
      return;
    }

    if (mode === "signUp") {
      if (!name.trim()) {
        Alert.alert("Missing Info", "Please enter your name.");
        return;
      }
      if (!phone.trim()) {
        Alert.alert("Missing Info", "Please enter your phone number.");
        return;
      }
    }

    setSubmitting(true);

    let errorMsg: string | null;
    if (mode === "signUp") {
      errorMsg = await signUp(email.trim(), password, name.trim(), phone.trim());
    } else {
      errorMsg = await signIn(email.trim(), password);
    }

    setSubmitting(false);

    if (errorMsg) {
      Alert.alert(mode === "signUp" ? "Sign Up Failed" : "Sign In Failed", errorMsg);
      return;
    }

    // Success — go back to where they came from
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/order");
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
  };

  if (mode === "forgotPassword") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => setMode("signIn")} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset link.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={GeckosColors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />

          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Send Reset Link</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>
          {mode === "signIn" ? "Sign In" : "Create Account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "signIn"
            ? "Sign in to place your order."
            : "Create an account to start ordering."}
        </Text>

        {mode === "signUp" && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={GeckosColors.mutedText}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={GeckosColors.mutedText}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={GeckosColors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={GeckosColors.mutedText}
          secureTextEntry
        />

        {mode === "signIn" && (
          <Pressable onPress={() => setMode("forgotPassword")} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === "signIn" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={toggleMode} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {mode === "signIn"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: GeckosColors.geckoGreen,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: GeckosColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: GeckosColors.mutedText,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: GeckosColors.text,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 10,
    paddingVertical: 4,
  },
  forgotText: {
    color: GeckosColors.geckoGreen,
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
  },
  toggleText: {
    color: GeckosColors.geckoGreen,
    fontSize: 15,
  },
});
