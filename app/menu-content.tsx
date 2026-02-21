import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";

type MenuCategory = {
  id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
};

type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_text: string | null;
  choice_count: number;
  sort_order: number;
  is_active: boolean;
};

type ItemFormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceText: string;
  choiceCount: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: ItemFormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  priceText: "",
  choiceCount: "0",
  sortOrder: "0",
  isActive: true,
};

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
      <Ionicons name="restaurant-outline" size={48} color={GeckosColors.geckoGreen} />
      <GeckosText style={styles.loginTitle}>Menu Dashboard</GeckosText>
      <GeckosText style={styles.loginSub}>Staff access required</GeckosText>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={GeckosColors.mutedText}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={GeckosColors.mutedText}
        secureTextEntry
      />

      <Pressable
        onPress={handleSignIn}
        disabled={loading}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, loading && styles.btnDisabled]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Sign In</GeckosText>}
      </Pressable>
    </View>
  );
}

function Unauthorized({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.centerState}>
      <Ionicons name="lock-closed-outline" size={34} color={GeckosColors.chiliRed} />
      <GeckosText style={styles.stateText}>You do not have staff access.</GeckosText>
      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
        <GeckosText style={styles.secondaryBtnText}>Sign Out</GeckosText>
      </Pressable>
    </View>
  );
}

export default function MenuContentScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [items, setItems] = useState<MenuItemRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);

  const checkStaffAccess = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user?.id) {
      setIsStaff(false);
      setAuthReady(true);
      return;
    }
    const { data } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();
    setIsStaff(!!data);
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

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("menu_categories")
      .select("id, title, sort_order, is_active")
      .order("sort_order", { ascending: true });
    const rows = (data ?? []) as MenuCategory[];
    setCategories(rows);

    if (!selectedCategoryId && rows[0]?.id) {
      setSelectedCategoryId(rows[0].id);
    }
  }, [selectedCategoryId]);

  const fetchItems = useCallback(async () => {
    if (!selectedCategoryId) {
      setItems([]);
      return;
    }

    const { data } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, price_text, choice_count, sort_order, is_active")
      .eq("category_id", selectedCategoryId)
      .order("sort_order", { ascending: true });

    setItems((data ?? []) as MenuItemRow[]);
  }, [selectedCategoryId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchCategories();
    await fetchItems();
    setLoading(false);
  }, [fetchCategories, fetchItems]);

  useEffect(() => {
    if (!isStaff) return;
    refreshAll();
  }, [isStaff, refreshAll]);

  useEffect(() => {
    if (!isStaff) return;
    fetchItems();
  }, [fetchItems, isStaff, selectedCategoryId]);

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    if (!selectedCategoryId) {
      Alert.alert("No category selected", "Select a category first.");
      return;
    }
    const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(nextSort),
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: MenuItemRow) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.price == null ? "" : String(item.price),
      priceText: item.price_text ?? "",
      choiceCount: String(item.choice_count ?? 0),
      sortOrder: String(item.sort_order ?? 0),
      isActive: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      Alert.alert("Missing category", "Select a category first.");
      return;
    }
    if (!form.id.trim()) {
      Alert.alert("Item ID required", "Use a stable id like grilled-shrimp.");
      return;
    }
    if (!form.name.trim()) {
      Alert.alert("Item name required", "Please enter a name.");
      return;
    }

    const parsedPrice = form.price.trim() ? Number(form.price.trim()) : null;
    if (form.price.trim() && Number.isNaN(parsedPrice)) {
      Alert.alert("Invalid price", "Price must be a valid number.");
      return;
    }
    const parsedChoiceCount = Number(form.choiceCount.trim() || "0");
    const parsedSortOrder = Number(form.sortOrder.trim() || "0");
    if (Number.isNaN(parsedChoiceCount) || Number.isNaN(parsedSortOrder)) {
      Alert.alert("Invalid numbers", "Choice count and sort order must be valid numbers.");
      return;
    }

    setSaving(true);
    const payload = {
      id: form.id.trim(),
      category_id: selectedCategoryId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parsedPrice,
      price_text: form.priceText.trim() || null,
      choice_count: parsedChoiceCount,
      sort_order: parsedSortOrder,
      is_active: form.isActive,
    };

    const result = editingId
      ? await supabase.from("menu_items").update(payload).eq("id", editingId)
      : await supabase.from("menu_items").insert(payload);

    setSaving(false);

    if (result.error) {
      Alert.alert("Save failed", result.error.message);
      return;
    }

    resetForm();
    await fetchItems();
  };

  const handleToggleActive = async (item: MenuItemRow) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }
    await fetchItems();
  };

  const handleDelete = async (item: MenuItemRow) => {
    Alert.alert("Delete Item", `Delete "${item.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
          if (error) {
            Alert.alert("Delete failed", error.message);
            return;
          }
          await fetchItems();
        },
      },
    ]);
  };

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsStaff(false);
    setCategories([]);
    setItems([]);
  }, []);

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
          <StaffLogin onSignedIn={(nextSession) => setSession(nextSession)} />
        </AppContainer>
      </>
    );
  }

  if (!isStaff) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <Unauthorized onSignOut={handleSignOut} />
        </AppContainer>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <GeckosText style={styles.headerTitle}>Menu Dashboard</GeckosText>
              <GeckosText style={styles.headerSub}>
                {currentCategory ? `Category: ${currentCategory.title}` : "Select a category"}
              </GeckosText>
            </View>
            <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <GeckosText style={styles.secondaryBtnText}>Sign Out</GeckosText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <GeckosText style={styles.sectionTitle}>Categories</GeckosText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((cat) => {
                const active = cat.id === selectedCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      active && styles.categoryChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <GeckosText style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {cat.title}
                    </GeckosText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.rowActions}>
            <Pressable onPress={openCreate} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <Ionicons name="add" size={16} color="#fff" />
              <GeckosText style={styles.primaryBtnText}>Add Item</GeckosText>
            </Pressable>
          </View>

          {showForm && (
            <View style={styles.card}>
              <GeckosText style={styles.sectionTitle}>{editingId ? "Edit Item" : "New Item"}</GeckosText>

              <GeckosText style={styles.inputLabel}>Item ID *</GeckosText>
              <TextInput
                style={styles.input}
                value={form.id}
                onChangeText={(v) => setForm((prev) => ({ ...prev, id: v.toLowerCase().replace(/\s+/g, "-") }))}
                placeholder="grilled-shrimp"
                placeholderTextColor={GeckosColors.mutedText}
                editable={!editingId}
              />

              <GeckosText style={styles.inputLabel}>Name *</GeckosText>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                placeholder="Grilled Shrimp"
                placeholderTextColor={GeckosColors.mutedText}
              />

              <GeckosText style={styles.inputLabel}>Description</GeckosText>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.description}
                onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
                placeholder="Optional description"
                placeholderTextColor={GeckosColors.mutedText}
                multiline
              />

              <View style={styles.halfRow}>
                <View style={styles.halfCol}>
                  <GeckosText style={styles.inputLabel}>Price</GeckosText>
                  <TextInput
                    style={styles.input}
                    value={form.price}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, price: v }))}
                    placeholder="12.99"
                    placeholderTextColor={GeckosColors.mutedText}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfCol}>
                  <GeckosText style={styles.inputLabel}>Choice Count</GeckosText>
                  <TextInput
                    style={styles.input}
                    value={form.choiceCount}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, choiceCount: v }))}
                    placeholder="0"
                    placeholderTextColor={GeckosColors.mutedText}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <GeckosText style={styles.inputLabel}>Price Text</GeckosText>
              <TextInput
                style={styles.input}
                value={form.priceText}
                onChangeText={(v) => setForm((prev) => ({ ...prev, priceText: v }))}
                placeholder="Chicken 12.99 | Beef 14.99"
                placeholderTextColor={GeckosColors.mutedText}
              />

              <View style={styles.halfRow}>
                <View style={styles.halfCol}>
                  <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
                  <TextInput
                    style={styles.input}
                    value={form.sortOrder}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, sortOrder: v }))}
                    placeholder="0"
                    placeholderTextColor={GeckosColors.mutedText}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.halfCol, styles.switchCol]}>
                  <GeckosText style={styles.inputLabel}>Active</GeckosText>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
                    trackColor={{ true: GeckosColors.geckoGreen, false: GeckosColors.border }}
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                <Pressable onPress={resetForm} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, saving && styles.btnDisabled]}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save Item</GeckosText>}
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <GeckosText style={styles.sectionTitle}>Items ({items.length})</GeckosText>
            {loading ? (
              <ActivityIndicator color={GeckosColors.geckoGreen} />
            ) : items.length === 0 ? (
              <GeckosText style={styles.emptyText}>No items in this category.</GeckosText>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <GeckosText style={styles.itemName}>{item.name}</GeckosText>
                    <GeckosText style={styles.itemMeta}>
                      id: {item.id} · sort: {item.sort_order} · {item.is_active ? "active" : "hidden"}
                    </GeckosText>
                    {item.price != null ? <GeckosText style={styles.itemMeta}>${Number(item.price).toFixed(2)}</GeckosText> : null}
                    {item.price_text ? <GeckosText style={styles.itemMeta}>{item.price_text}</GeckosText> : null}
                  </View>
                  <View style={styles.itemButtons}>
                    <Pressable onPress={() => openEdit(item)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                    </Pressable>
                    <Pressable onPress={() => handleToggleActive(item)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name={item.is_active ? "eye-off-outline" : "eye-outline"} size={16} color={GeckosColors.mutedText} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 44,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  card: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  categoryRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
  },
  categoryChipActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  categoryChipTextActive: {
    color: GeckosColors.geckoGreen,
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: GeckosColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.text,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  halfRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfCol: {
    flex: 1,
    gap: 6,
  },
  switchCol: {
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
    paddingTop: 10,
  },
  itemMain: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  itemButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GeckosColors.chiliRed,
    backgroundColor: GeckosColors.chiliRed,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: GeckosColors.mutedText,
    fontWeight: "600",
    fontSize: 13,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 12,
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
    marginBottom: 4,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  stateText: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    textAlign: "center",
  },
  pressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.6 },
});
