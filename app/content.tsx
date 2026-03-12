// app/content.tsx
// Staff-only "What's Happening" content dashboard for Michelle.
// Protected by the same staff_access check used by the kitchen dashboard.
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { StaffNav } from "@/src/components/StaffNav";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";


/* ─────────────────────── TYPES ─────────────────────── */

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  emoji: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

/* ─────────────────────── STAFF LOGIN ─────────────────────── */

function StaffLogin({ onSignedIn }: { onSignedIn: (s: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error || !data.session) {
      Alert.alert("Sign In Failed", error?.message ?? "Unknown error");
      return;
    }
    onSignedIn(data.session);
  };

  return (
    <View style={styles.loginContainer}>
      <Ionicons name="megaphone-outline" size={48} color={GeckosColors.geckoGreen} />
      <GeckosText style={styles.loginTitle}>Content Dashboard</GeckosText>
      <GeckosText style={styles.loginSub}>Staff access required</GeckosText>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={GeckosColors.mutedText}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={GeckosColors.mutedText}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleSignIn}
      />
      <Pressable
        onPress={handleSignIn}
        disabled={loading}
        style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed, loading && styles.btnDisabled]}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <GeckosText style={styles.loginBtnText}>Sign In</GeckosText>}
      </Pressable>
    </View>
  );
}

/* ─────────────────────── ANNOUNCEMENT FORM ─────────────────────── */

const EMOJI_PICKS = ["📢", "🌮", "🎉", "⭐", "🔥", "🍹", "🎸", "🏖️", "💃", "🤠"];

function AnnouncementForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Announcement>;
  onSave: (data: { title: string; body: string; emoji: string; imageUri: string | null }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📢");
  const [imageUri, setImageUri] = useState<string | null>(initial?.image_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [5, 2],  // wide announcement banner
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const fileName = `announcement-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from("announcement-images")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("announcement-images")
        .getPublicUrl(fileName);
      setImageUri(urlData.publicUrl);
    } catch (err: unknown) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError("A title is required — please add one before saving.");
      return;
    }
    setTitleError(null);
    onSave({ title: title.trim(), body: body.trim(), emoji, imageUri });
  };

  return (
    <View style={styles.formCard}>
      <GeckosText style={styles.formCardTitle}>
        {initial?.id ? "Edit Post" : "New Post"}
      </GeckosText>

      <GeckosText style={styles.fieldLabel}>Emoji</GeckosText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
        {EMOJI_PICKS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={[styles.emojiOption, emoji === e && styles.emojiOptionSelected]}
          >
            <GeckosText style={styles.emojiOptionText}>{e}</GeckosText>
          </Pressable>
        ))}
      </ScrollView>

      <GeckosText style={[styles.fieldLabel, titleError ? styles.fieldLabelError : null]}>
        Title *
      </GeckosText>
      <TextInput
        style={[styles.input, titleError ? styles.inputError : null]}
        value={title}
        onChangeText={(text) => { setTitle(text); if (titleError) setTitleError(null); }}
        placeholder="e.g. Live Music This Saturday!"
        placeholderTextColor={GeckosColors.mutedText}
        returnKeyType="next"
      />
      {titleError ? (
        <View style={styles.inlineError}>
          <Ionicons name="alert-circle" size={15} color={GeckosColors.chiliRed} />
          <GeckosText style={styles.inlineErrorText}>{titleError}</GeckosText>
        </View>
      ) : null}

      <GeckosText style={styles.fieldLabel}>Details (optional)</GeckosText>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={body}
        onChangeText={setBody}
        placeholder="Any extra details..."
        placeholderTextColor={GeckosColors.mutedText}
        multiline
        numberOfLines={3}
        returnKeyType="done"
      />

      <GeckosText style={styles.fieldLabel}>Photo (optional)</GeckosText>
      {imageUri ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <Pressable
            onPress={() => setImageUri(null)}
            style={styles.imageRemoveBtn}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={24} color={GeckosColors.chiliRed} />
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            onPress={handlePickImage}
            disabled={uploadingImage}
            style={({ pressed }) => [styles.imagePickBtn, pressed && styles.pressed, uploadingImage && styles.btnDisabled]}
          >
            {uploadingImage ? (
              <ActivityIndicator color={GeckosColors.mutedText} size="small" />
            ) : (
              <Ionicons name="image-outline" size={20} color={GeckosColors.mutedText} />
            )}
            <GeckosText style={styles.imagePickBtnText}>
              {uploadingImage ? "Uploading..." : "Add Photo"}
            </GeckosText>
          </Pressable>
          <GeckosText style={styles.imageHintText}>Wide (5:2) — announcement banner</GeckosText>
        </>
      )}

      <View style={styles.formActions}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        >
          <GeckosText style={styles.cancelBtnText}>Cancel</GeckosText>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving || uploadingImage}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, (saving || uploadingImage) && styles.btnDisabled]}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <GeckosText style={styles.saveBtnText}>Save</GeckosText>}
        </Pressable>
      </View>
    </View>
  );
}

/* ─────────────────────── ANNOUNCEMENT ROW ─────────────────────── */

function AnnouncementRow({
  item,
  onEdit,
  onToggle,
  onDelete,
  onNotify,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  notifying,
}: {
  item: Announcement;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onNotify: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  notifying: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <View style={[styles.rowCard, !item.active && styles.rowCardInactive]}>
      <View style={styles.rowOrderBtns}>
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed, isFirst && styles.orderBtnDisabled]}
        >
          <Ionicons name="chevron-up" size={16} color={isFirst ? GeckosColors.border : GeckosColors.text} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          style={({ pressed }) => [styles.orderBtn, pressed && styles.pressed, isLast && styles.orderBtnDisabled]}
        >
          <Ionicons name="chevron-down" size={16} color={isLast ? GeckosColors.border : GeckosColors.text} />
        </Pressable>
      </View>

      <GeckosText style={styles.rowEmoji}>{item.emoji}</GeckosText>

      <View style={styles.rowContent}>
        <GeckosText style={[styles.rowTitle, !item.active && styles.rowTitleInactive]}>
          {item.title}
        </GeckosText>
        {item.body ? (
          <GeckosText style={styles.rowBody} numberOfLines={2}>{item.body}</GeckosText>
        ) : null}
        {!item.active && (
          <GeckosText style={styles.rowHiddenTag}>Hidden</GeckosText>
        )}
      </View>

      <View style={styles.rowActions}>
        {confirmDelete ? (
          <>
            <Pressable
              onPress={() => setConfirmDelete(false)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="close-outline" size={18} color={GeckosColors.mutedText} />
            </Pressable>
            <Pressable
              onPress={() => { setConfirmDelete(false); onDelete(); }}
              style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="checkmark-outline" size={18} color="#fff" />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={onNotify}
              disabled={notifying}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed, notifying && styles.btnDisabled]}
              hitSlop={8}
            >
              {notifying
                ? <ActivityIndicator size="small" color={GeckosColors.geckoGreen} />
                : <Ionicons name="notifications-outline" size={18} color={GeckosColors.geckoGreen} />}
            </Pressable>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={18} color={GeckosColors.geckoGreen} />
            </Pressable>
            <Pressable
              onPress={onToggle}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons
                name={item.active ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={GeckosColors.mutedText}
              />
            </Pressable>
            <Pressable
              onPress={() => setConfirmDelete(true)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={GeckosColors.chiliRed} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

/* ─────────────────────── UNAUTHORIZED ─────────────────────── */

function Unauthorized({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.centerState}>
      <Ionicons name="lock-closed-outline" size={36} color={GeckosColors.chiliRed} />
      <GeckosText style={styles.stateText}>You don&apos;t have staff access.</GeckosText>
      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
      >
        <GeckosText style={styles.signOutButtonText}>Sign Out</GeckosText>
      </Pressable>
    </View>
  );
}

/* ─────────────────────── MAIN SCREEN ─────────────────────── */

export default function ContentScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const checkStaffAccess = useCallback(async (currentSession: Session | null) => {
    setAuthError(null);
    if (!currentSession) { setIsStaff(false); setAuthReady(true); return; }
    const { data, error } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();
    if (error) { setAuthError("Could not verify staff access."); setIsStaff(false); }
    else { setIsStaff(!!data); }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      checkStaffAccess(data.session ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setAuthReady(false);
      checkStaffAccess(nextSession ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [checkStaffAccess]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, emoji, image_url, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setAnnouncements(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isStaff) fetchAnnouncements();
  }, [isStaff, fetchAnnouncements]);

  const handleSave = async (data: { title: string; body: string; emoji: string; imageUri: string | null }) => {
    setSaving(true);
    if (editingItem) {
      const { error } = await supabase
        .from("announcements")
        .update({ title: data.title, body: data.body || null, emoji: data.emoji, image_url: data.imageUri })
        .eq("id", editingItem.id);
      if (error) Alert.alert("Save failed", error.message);
    } else {
      const maxOrder = announcements.reduce((m, a) => Math.max(m, a.sort_order), -1);
      const { error } = await supabase
        .from("announcements")
        .insert({ title: data.title, body: data.body || null, emoji: data.emoji, image_url: data.imageUri, sort_order: maxOrder + 1 });
      if (error) Alert.alert("Save failed", error.message);
    }
    setSaving(false);
    setShowForm(false);
    setEditingItem(null);
    await fetchAnnouncements();
  };

  const handleToggle = async (item: Announcement) => {
    await supabase
      .from("announcements")
      .update({ active: !item.active })
      .eq("id", item.id);
    await fetchAnnouncements();
  };

  const handleDelete = async (item: Announcement) => {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", item.id);

    if (error) {
      Alert.alert("Delete failed", error.message);
      return;
    }

    await fetchAnnouncements();
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= announcements.length) return;

    const a = announcements[index];
    const b = announcements[swapIndex];
    await Promise.all([
      supabase.from("announcements").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("announcements").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await fetchAnnouncements();
  };

  const handleNotify = useCallback(async (item: Announcement) => {
    setNotifyingId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-announcement-notification", {
        body: {
          title: `${item.emoji} ${item.title}`,
          body: item.body ?? "",
        },
      });
      if (error) throw error;
      Alert.alert("Notification Sent!", `Notified ${data?.sent ?? 0} device${data?.sent !== 1 ? "s" : ""}.`);
    } catch (err: unknown) {
      Alert.alert("Send Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setNotifyingId(null);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsStaff(false);
    setAnnouncements([]);
  }, []);

  const onSignedIn = useCallback((nextSession: Session) => {
    setSession(nextSession);
    setAuthReady(false);
    checkStaffAccess(nextSession);
  }, [checkStaffAccess]);

  /* ── Auth gates ── */
  if (!authReady) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <View style={styles.centerState}>
            <ActivityIndicator color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.stateText}>Checking staff access...</GeckosText>
          </View>
        </AppContainer>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <StaffLogin onSignedIn={onSignedIn} />
        </AppContainer>
      </>
    );
  }

  if (!isStaff || authError) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          {authError ? (
            <View style={styles.centerState}>
              <Ionicons name="alert-circle-outline" size={30} color={GeckosColors.chiliRed} />
              <GeckosText style={styles.stateText}>{authError}</GeckosText>
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
              >
                <GeckosText style={styles.signOutButtonText}>Sign Out</GeckosText>
              </Pressable>
            </View>
          ) : (
            <Unauthorized onSignOut={handleSignOut} />
          )}
        </AppContainer>
      </>
    );
  }

  /* ── Main dashboard ── */
  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <GeckosText style={styles.headerTitle}>What&apos;s Happening</GeckosText>
              <GeckosText style={styles.headerSub}>
                {announcements.filter((a) => a.active).length} active post
                {announcements.filter((a) => a.active).length !== 1 ? "s" : ""} showing to customers
              </GeckosText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
              >
                <GeckosText style={styles.signOutButtonText}>Sign Out</GeckosText>
              </Pressable>
            </View>
          </View>

          <StaffNav active="content" />

          {/* New post button */}
          {!showForm && !editingItem && (
            <Pressable
              onPress={() => setShowForm(true)}
              style={({ pressed }) => [styles.newPostBtn, pressed && styles.pressed]}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <GeckosText style={styles.newPostBtnText}>New Post</GeckosText>
            </Pressable>
          )}

          {/* Add / edit form */}
          {(showForm || editingItem) && (
            <AnnouncementForm
              initial={editingItem ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingItem(null); }}
              saving={saving}
            />
          )}

          {/* List */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={GeckosColors.geckoGreen} />
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={40} color={GeckosColors.mutedText} />
              <GeckosText style={styles.emptyStateText}>
                No posts yet. Tap &quot;New Post&quot; to add one.
              </GeckosText>
            </View>
          ) : (
            announcements.map((item, index) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === announcements.length - 1}
                onEdit={() => { setEditingItem(item); setShowForm(false); }}
                onToggle={() => handleToggle(item)}
                onDelete={() => { void handleDelete(item); }}
                onNotify={() => { void handleNotify(item); }}
                onMoveUp={() => handleMove(index, "up")}
                onMoveDown={() => handleMove(index, "down")}
                notifying={notifyingId === item.id}
              />
            ))
          )}
        </ScrollView>
      </AppContainer>
    </>
  );
}

/* ─────────────────────── STYLES ─────────────────────── */

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  /* Auth states */
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  stateText: {
    fontSize: 15,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    textAlign: "center",
  },

  /* Login */
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 14,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  loginSub: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginBottom: 8,
  },
  loginBtn: {
    width: "100%",
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },

  /* New post button */
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 999,
    paddingVertical: 14,
  },
  newPostBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },

  /* Form card */
  formCard: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 16,
    gap: 10,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emojiRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: GeckosColors.background,
  },
  emojiOptionSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(20, 143, 26, 0.1)",
  },
  emojiOptionText: {
    fontSize: 22,
  },
  input: {
    backgroundColor: GeckosColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.text,
  },
  inputError: {
    borderColor: GeckosColors.chiliRed,
    borderWidth: 1.5,
  },
  fieldLabelError: {
    color: GeckosColors.chiliRed,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  inlineErrorText: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.chiliRed,
    flex: 1,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  imagePickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 18,
    backgroundColor: GeckosColors.background,
  },
  imagePickBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  imageHintText: {
    fontSize: 11,
    color: GeckosColors.mutedText,
    marginTop: 5,
    textAlign: "center",
  },
  imagePreviewWrap: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },

  /* Announcement row */
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: GeckosColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 12,
  },
  rowCardInactive: {
    opacity: 0.55,
  },
  rowOrderBtns: {
    gap: 2,
  },
  orderBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: GeckosColors.background,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBtnDisabled: {
    opacity: 0.3,
  },
  rowEmoji: {
    fontSize: 26,
    width: 36,
    textAlign: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  rowTitleInactive: {
    color: GeckosColors.mutedText,
  },
  rowBody: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    lineHeight: 16,
  },
  rowHiddenTag: {
    fontSize: 11,
    fontWeight: "800",
    color: GeckosColors.chiliRed,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GeckosColors.background,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GeckosColors.chiliRed,
    borderWidth: 1,
    borderColor: GeckosColors.chiliRed,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty / sign out */
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  pressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.5 },
});
