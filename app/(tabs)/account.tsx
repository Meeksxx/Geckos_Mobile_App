import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { useAuth } from "@/src/context/AuthContext";
import { GeckosColors } from "@/src/theme/colors";

function SignedOut() {
  const router = useRouter();

  return (
    <View style={styles.centeredContainer}>
      <View style={styles.iconWrap}>
        <Ionicons name="person-circle-outline" size={56} color={GeckosColors.geckoGreen} />
      </View>
      <GeckosText style={styles.heading}>Welcome</GeckosText>
      <GeckosText style={styles.body}>
        Sign in or create an account to place orders and save your info.
      </GeckosText>
      <Pressable
        onPress={() => router.push("/auth" as any)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <GeckosText style={styles.primaryButtonText}>Sign In / Sign Up</GeckosText>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL("https://www.privacypolicies.com/live/8ae4bec2-b302-4d4e-880d-59c91b837ea7").catch(() => {})}
        style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}
      >
        <GeckosText style={styles.privacyLinkText}>Privacy Policy</GeckosText>
      </Pressable>
    </View>
  );
}

function SignedIn() {
  const { profile, signOut, updateProfile, deleteAccount, isStaff } = useAuth();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Info", "Name and phone are required.");
      return;
    }
    setSaving(true);
    const err = await updateProfile(name.trim(), phone.trim());
    setSaving(false);
    if (err) {
      Alert.alert("Update Failed", err);
    } else {
      setEditing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data including order history and rewards points. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const err = await deleteAccount();
            setDeleting(false);
            if (err) Alert.alert("Error", err);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GeckosText style={styles.screenTitle}>Account</GeckosText>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle" size={40} color={GeckosColors.geckoGreen} />
          <View style={styles.cardHeaderText}>
            <GeckosText style={styles.profileName}>
              {profile?.display_name ?? "Guest"}
            </GeckosText>
            <GeckosText style={styles.profilePhone}>
              {profile?.phone ?? ""}
            </GeckosText>
          </View>
        </View>

        {editing ? (
          <View style={styles.editSection}>
            <GeckosText style={styles.inputLabel}>Name</GeckosText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={GeckosColors.mutedText}
              autoCapitalize="words"
            />
            <GeckosText style={styles.inputLabel}>Phone</GeckosText>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={GeckosColors.mutedText}
              keyboardType="phone-pad"
            />
            <View style={styles.editButtons}>
              <Pressable
                onPress={() => {
                  setName(profile?.display_name ?? "");
                  setPhone(profile?.phone ?? "");
                  setEditing(false);
                }}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              >
                <GeckosText style={styles.cancelButtonText}>Cancel</GeckosText>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  saving && styles.disabled,
                ]}
              >
                <GeckosText style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save"}
                </GeckosText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={({ pressed }) => [styles.editLink, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.editLinkText}>Edit Profile</GeckosText>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => router.push("/orders" as any)}
        style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}
      >
        <Ionicons name="receipt-outline" size={18} color={GeckosColors.geckoGreen} />
        <GeckosText style={styles.historyButtonText}>Order History</GeckosText>
        <Ionicons name="chevron-forward" size={16} color={GeckosColors.mutedText} />
      </Pressable>

      {isStaff && (
        <Pressable
          onPress={() => router.push("/kitchen" as any)}
          style={({ pressed }) => [styles.staffButton, pressed && styles.pressed]}
        >
          <Ionicons name="restaurant-outline" size={18} color={GeckosColors.geckoGreen} />
          <GeckosText style={styles.staffButtonText}>Staff Dashboard</GeckosText>
          <Ionicons name="chevron-forward" size={16} color={GeckosColors.mutedText} />
        </Pressable>
      )}

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
      >
        <Ionicons name="log-out-outline" size={20} color={GeckosColors.chiliRed} />
        <GeckosText style={styles.signOutText}>Sign Out</GeckosText>
      </Pressable>

      <Pressable
        onPress={handleDeleteAccount}
        disabled={deleting}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, deleting && styles.disabled]}
      >
        <GeckosText style={styles.deleteText}>
          {deleting ? "Deleting..." : "Delete Account"}
        </GeckosText>
      </Pressable>

      <Pressable
        onPress={() => Linking.openURL("https://www.privacypolicies.com/live/8ae4bec2-b302-4d4e-880d-59c91b837ea7").catch(() => {})}
        style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}
      >
        <GeckosText style={styles.privacyLinkText}>Privacy Policy</GeckosText>
      </Pressable>
    </ScrollView>
  );
}

export default function AccountScreen() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <View style={styles.centeredContainer}>
            <GeckosText style={styles.body}>Loading...</GeckosText>
          </View>
        </AppContainer>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        {isLoggedIn ? <SignedIn /> : <SignedOut />}
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heading: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  primaryButton: {
    marginTop: 28,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },

  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 20,
  },

  // Profile card
  card: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  profilePhone: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  editLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
  },
  editLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
  },

  // Edit form
  editSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: GeckosColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.text,
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: GeckosColors.geckoGreen,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // Order history
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
    marginBottom: 12,
  },
  historyButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: GeckosColors.text,
  },

  // Staff dashboard
  staffButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: GeckosColors.surface,
    marginBottom: 12,
  },
  staffButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
  },

  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: GeckosColors.chiliRed,
  },

  // Privacy policy
  privacyLink: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  privacyLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textDecorationLine: "underline",
  },

  // Delete account
  deleteButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textDecorationLine: "underline",
  },
});
