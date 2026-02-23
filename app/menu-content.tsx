import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";

/* ─────────────────────── TYPES ─────────────────────── */

type Tab = "items" | "categories" | "lunch";

type MenuCategory = {
  id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
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
  image_url: string | null;
};

type AddOnRow = {
  id: string;
  item_id: string;
  name: string;
  price: number;
  sort_order: number;
};

type LunchChoiceRow = {
  id: string;
  name: string;
  sort_order: number;
};

type LunchSauceRow = {
  id: string;
  name: string;
  price: number;
  sort_order: number;
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
  imageUri: string | null;
};

type CategoryFormState = {
  id: string;
  title: string;
  sortOrder: string;
  isActive: boolean;
  imageUri: string | null;
};

type AddOnFormState = {
  name: string;
  price: string;
  sortOrder: string;
};

type LunchChoiceFormState = {
  name: string;
  sortOrder: string;
};

type LunchSauceFormState = {
  name: string;
  price: string;
  sortOrder: string;
};

/* ─────────────────────── DEFAULT FORM VALUES ─────────────────────── */

const EMPTY_ITEM_FORM: ItemFormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  priceText: "",
  choiceCount: "0",
  sortOrder: "0",
  isActive: true,
  imageUri: null,
};

const EMPTY_CAT_FORM: CategoryFormState = {
  id: "",
  title: "",
  sortOrder: "0",
  isActive: true,
  imageUri: null,
};

const EMPTY_ADDON_FORM: AddOnFormState = { name: "", price: "0.00", sortOrder: "0" };
const EMPTY_LC_FORM: LunchChoiceFormState = { name: "", sortOrder: "0" };
const EMPTY_LS_FORM: LunchSauceFormState = { name: "", price: "0.00", sortOrder: "0" };

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

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

/* ─────────────────────── MAIN SCREEN ─────────────────────── */

export default function MenuContentScreen() {
  /* ── Auth ── */
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState<Tab>("items");

  /* ── Items tab ── */
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);

  /* ── Add-ons panel (within Items tab) ── */
  const [addOnsItemId, setAddOnsItemId] = useState<string | null>(null);
  const [addOnsItemName, setAddOnsItemName] = useState<string>("");
  const [addOns, setAddOns] = useState<AddOnRow[]>([]);
  const [addOnsSaving, setAddOnsSaving] = useState(false);
  const [showAddOnForm, setShowAddOnForm] = useState(false);
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null);
  const [addOnForm, setAddOnForm] = useState<AddOnFormState>(EMPTY_ADDON_FORM);

  /* ── Categories tab ── */
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CategoryFormState>(EMPTY_CAT_FORM);
  const [catSaving, setCatSaving] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);

  /* ── Lunch tab ── */
  const [lunchChoices, setLunchChoices] = useState<LunchChoiceRow[]>([]);
  const [lunchSauces, setLunchSauces] = useState<LunchSauceRow[]>([]);
  const [lunchLoading, setLunchLoading] = useState(false);
  const [showLcForm, setShowLcForm] = useState(false);
  const [editingLcId, setEditingLcId] = useState<string | null>(null);
  const [lcForm, setLcForm] = useState<LunchChoiceFormState>(EMPTY_LC_FORM);
  const [lcSaving, setLcSaving] = useState(false);
  const [showLsForm, setShowLsForm] = useState(false);
  const [editingLsId, setEditingLsId] = useState<string | null>(null);
  const [lsForm, setLsForm] = useState<LunchSauceFormState>(EMPTY_LS_FORM);
  const [lsSaving, setLsSaving] = useState(false);

  /* ─────────────────── AUTH ─────────────────── */

  const checkStaffAccess = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user?.id) { setIsStaff(false); setAuthReady(true); return; }
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
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [checkStaffAccess]);

  /* ─────────────────── DATA FETCHING ─────────────────── */

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("menu_categories")
      .select("id, title, sort_order, is_active, image_url")
      .order("sort_order", { ascending: true });
    const rows = (data ?? []) as MenuCategory[];
    setCategories(rows);
    if (!selectedCategoryId && rows[0]?.id) setSelectedCategoryId(rows[0].id);
  }, [selectedCategoryId]);

  const fetchItems = useCallback(async () => {
    if (!selectedCategoryId) { setItems([]); return; }
    setItemsError(null);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, price_text, choice_count, sort_order, is_active, image_url")
      .eq("category_id", selectedCategoryId)
      .order("sort_order", { ascending: true });
    if (error) {
      setItemsError(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as MenuItemRow[]);
    }
  }, [selectedCategoryId]);

  const fetchAddOns = useCallback(async (itemId: string) => {
    const { data } = await supabase
      .from("menu_item_addons")
      .select("id, item_id, name, price, sort_order")
      .eq("item_id", itemId)
      .order("sort_order", { ascending: true });
    setAddOns((data ?? []) as AddOnRow[]);
  }, []);

  const fetchLunchData = useCallback(async () => {
    setLunchLoading(true);
    const [choiceRes, sauceRes] = await Promise.all([
      supabase.from("lunch_choices").select("id, name, sort_order").order("sort_order", { ascending: true }),
      supabase.from("lunch_sauces").select("id, name, price, sort_order").order("sort_order", { ascending: true }),
    ]);
    setLunchChoices((choiceRes.data ?? []) as LunchChoiceRow[]);
    setLunchSauces((sauceRes.data ?? []) as LunchSauceRow[]);
    setLunchLoading(false);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchCategories();
    await fetchItems();
    setLoading(false);
  }, [fetchCategories, fetchItems]);

  useEffect(() => { if (!isStaff) return; refreshAll(); }, [isStaff, refreshAll]);
  useEffect(() => { if (!isStaff) return; fetchItems(); }, [fetchItems, isStaff, selectedCategoryId]);
  useEffect(() => { if (!isStaff || activeTab !== "lunch") return; fetchLunchData(); }, [isStaff, activeTab, fetchLunchData]);

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  /* ─────────────────── ITEM OPERATIONS ─────────────────── */

  const resetItemForm = () => { setForm(EMPTY_ITEM_FORM); setEditingId(null); setShowForm(false); };

  const openCreateItem = () => {
    if (!selectedCategoryId) { Alert.alert("No category selected", "Select a category first."); return; }
    const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    setForm({ ...EMPTY_ITEM_FORM, sortOrder: String(nextSort) });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditItem = (item: MenuItemRow) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.price == null ? "" : String(item.price),
      priceText: item.price_text ?? "",
      choiceCount: String(item.choice_count ?? 0),
      sortOrder: String(item.sort_order ?? 0),
      isActive: item.is_active,
      imageUri: item.image_url ?? null,
    });
    setEditingId(item.id);
    setShowForm(true);
    // Close add-ons panel when opening edit form
    setAddOnsItemId(null);
    setShowAddOnForm(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const ext = (asset.uri.split(".").pop() ?? "jpg").toLowerCase();
      const fileName = `item-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from("menu-item-images")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("menu-item-images")
        .getPublicUrl(fileName);
      setForm((p) => ({ ...p, imageUri: urlData.publicUrl }));
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Unknown error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async () => {
    if (!selectedCategoryId) { Alert.alert("Missing category", "Select a category first."); return; }
    if (!form.id.trim()) { Alert.alert("Item ID required", 'Use a stable id like "grilled-shrimp".'); return; }
    if (!form.name.trim()) { Alert.alert("Item name required", "Please enter a name."); return; }
    const parsedPrice = form.price.trim() ? Number(form.price.trim()) : null;
    if (form.price.trim() && Number.isNaN(parsedPrice)) { Alert.alert("Invalid price", "Price must be a valid number."); return; }
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
      image_url: form.imageUri ?? null,
    };
    const result = editingId
      ? await supabase.from("menu_items").update(payload).eq("id", editingId)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (result.error) { Alert.alert("Save failed", result.error.message); return; }
    resetItemForm();
    await fetchItems();
  };

  const handleToggleItemActive = async (item: MenuItemRow) => {
    const { error } = await supabase.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) { Alert.alert("Update failed", error.message); return; }
    await fetchItems();
  };

  const handleDeleteItem = (item: MenuItemRow) => {
    setDeletingId(item.id);
    // Close other panels so the confirmation row is visible
    setShowForm(false);
    setAddOnsItemId(null);
  };

  const handleConfirmDelete = async (item: MenuItemRow) => {
    setDeletingId(null);
    const { data: deleted, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", item.id)
      .select("id");
    if (error) { Alert.alert("Delete failed", error.message); return; }
    if (!deleted || deleted.length === 0) {
      Alert.alert("Delete failed", "Permission denied. Make sure the staff write policy is applied in Supabase.");
      return;
    }
    if (addOnsItemId === item.id) { setAddOnsItemId(null); setAddOns([]); }
    await fetchItems();
  };

  /* ─────────────────── ADD-ON OPERATIONS ─────────────────── */

  const openAddOnsPanel = async (item: MenuItemRow) => {
    setAddOnsItemId(item.id);
    setAddOnsItemName(item.name);
    setShowAddOnForm(false);
    setEditingAddOnId(null);
    setAddOnForm(EMPTY_ADDON_FORM);
    setShowForm(false);
    setEditingId(null);
    await fetchAddOns(item.id);
  };

  const closeAddOnsPanel = () => {
    setAddOnsItemId(null);
    setAddOns([]);
    setShowAddOnForm(false);
    setEditingAddOnId(null);
  };

  const openEditAddOn = (ao: AddOnRow) => {
    setAddOnForm({ name: ao.name, price: String(ao.price), sortOrder: String(ao.sort_order) });
    setEditingAddOnId(ao.id);
    setShowAddOnForm(true);
  };

  const handleSaveAddOn = async () => {
    if (!addOnsItemId) return;
    if (!addOnForm.name.trim()) { Alert.alert("Name required", "Enter an add-on name."); return; }
    const parsedPrice = Number(addOnForm.price.trim() || "0");
    if (Number.isNaN(parsedPrice)) { Alert.alert("Invalid price", "Price must be a number."); return; }
    const parsedSort = Number(addOnForm.sortOrder.trim() || "0");
    setAddOnsSaving(true);
    const payload = { item_id: addOnsItemId, name: addOnForm.name.trim(), price: parsedPrice, sort_order: parsedSort };
    const result = editingAddOnId
      ? await supabase.from("menu_item_addons").update(payload).eq("id", editingAddOnId)
      : await supabase.from("menu_item_addons").insert(payload);
    setAddOnsSaving(false);
    if (result.error) { Alert.alert("Save failed", result.error.message); return; }
    setShowAddOnForm(false);
    setEditingAddOnId(null);
    setAddOnForm(EMPTY_ADDON_FORM);
    await fetchAddOns(addOnsItemId);
  };

  const handleDeleteAddOn = async (ao: AddOnRow) => {
    if (!addOnsItemId) return;
    Alert.alert("Delete Add-on", `Delete "${ao.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("menu_item_addons").delete().eq("id", ao.id);
          if (error) { Alert.alert("Delete failed", error.message); return; }
          await fetchAddOns(addOnsItemId);
        },
      },
    ]);
  };

  /* ─────────────────── CATEGORY OPERATIONS ─────────────────── */

  const resetCatForm = () => { setCatForm(EMPTY_CAT_FORM); setEditingCatId(null); setShowCatForm(false); };

  const openCreateCategory = () => {
    const nextSort = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0;
    setCatForm({ ...EMPTY_CAT_FORM, sortOrder: String(nextSort) });
    setEditingCatId(null);
    setShowCatForm(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setCatForm({ id: cat.id, title: cat.title, sortOrder: String(cat.sort_order), isActive: cat.is_active, imageUri: cat.image_url ?? null });
    setEditingCatId(cat.id);
    setShowCatForm(true);
  };

  const handlePickCategoryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingCatImage(true);
    try {
      const ext = (asset.uri.split(".").pop() ?? "jpg").toLowerCase();
      const fileName = `category-${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from("menu-item-images")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("menu-item-images")
        .getPublicUrl(fileName);
      setCatForm((p) => ({ ...p, imageUri: urlData.publicUrl }));
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Unknown error");
    } finally {
      setUploadingCatImage(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!catForm.id.trim()) { Alert.alert("Category ID required", 'Use a slug like "desserts" or "kid-meals".'); return; }
    if (!catForm.title.trim()) { Alert.alert("Title required", "Enter a category title."); return; }
    const parsedSort = Number(catForm.sortOrder.trim() || "0");
    if (Number.isNaN(parsedSort)) { Alert.alert("Invalid sort order", "Must be a number."); return; }
    setCatSaving(true);
    const payload = { id: catForm.id.trim(), title: catForm.title.trim(), sort_order: parsedSort, is_active: catForm.isActive, image_url: catForm.imageUri ?? null };
    const result = editingCatId
      ? await supabase.from("menu_categories").update(payload).eq("id", editingCatId)
      : await supabase.from("menu_categories").insert(payload);
    setCatSaving(false);
    if (result.error) { Alert.alert("Save failed", result.error.message); return; }
    resetCatForm();
    await fetchCategories();
  };

  const handleToggleCategoryActive = async (cat: MenuCategory) => {
    const { error } = await supabase.from("menu_categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    if (error) { Alert.alert("Update failed", error.message); return; }
    await fetchCategories();
  };

  const handleDeleteCategory = (cat: MenuCategory) => {
    Alert.alert(
      "Delete Category",
      `Delete "${cat.title}"? Any items in this category may become inaccessible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("menu_categories").delete().eq("id", cat.id);
            if (error) { Alert.alert("Delete failed", error.message); return; }
            if (selectedCategoryId === cat.id) setSelectedCategoryId("");
            await fetchCategories();
          },
        },
      ]
    );
  };

  /* ─────────────────── LUNCH CHOICE OPERATIONS ─────────────────── */

  const resetLcForm = () => { setLcForm(EMPTY_LC_FORM); setEditingLcId(null); setShowLcForm(false); };

  const openEditLunchChoice = (lc: LunchChoiceRow) => {
    setLcForm({ name: lc.name, sortOrder: String(lc.sort_order) });
    setEditingLcId(lc.id);
    setShowLcForm(true);
  };

  const handleSaveLunchChoice = async () => {
    if (!lcForm.name.trim()) { Alert.alert("Name required", "Enter a lunch choice name."); return; }
    const parsedSort = Number(lcForm.sortOrder.trim() || "0");
    setLcSaving(true);
    const payload = { name: lcForm.name.trim(), sort_order: parsedSort };
    const result = editingLcId
      ? await supabase.from("lunch_choices").update(payload).eq("id", editingLcId)
      : await supabase.from("lunch_choices").insert(payload);
    setLcSaving(false);
    if (result.error) { Alert.alert("Save failed", result.error.message); return; }
    resetLcForm();
    await fetchLunchData();
  };

  const handleDeleteLunchChoice = (lc: LunchChoiceRow) => {
    Alert.alert("Delete Choice", `Delete "${lc.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("lunch_choices").delete().eq("id", lc.id);
          if (error) { Alert.alert("Delete failed", error.message); return; }
          await fetchLunchData();
        },
      },
    ]);
  };

  /* ─────────────────── LUNCH SAUCE OPERATIONS ─────────────────── */

  const resetLsForm = () => { setLsForm(EMPTY_LS_FORM); setEditingLsId(null); setShowLsForm(false); };

  const openEditLunchSauce = (ls: LunchSauceRow) => {
    setLsForm({ name: ls.name, price: String(ls.price), sortOrder: String(ls.sort_order) });
    setEditingLsId(ls.id);
    setShowLsForm(true);
  };

  const handleSaveLunchSauce = async () => {
    if (!lsForm.name.trim()) { Alert.alert("Name required", "Enter a sauce name."); return; }
    const parsedPrice = Number(lsForm.price.trim() || "0");
    if (Number.isNaN(parsedPrice)) { Alert.alert("Invalid price", "Price must be a number."); return; }
    const parsedSort = Number(lsForm.sortOrder.trim() || "0");
    setLsSaving(true);
    const payload = { name: lsForm.name.trim(), price: parsedPrice, sort_order: parsedSort };
    const result = editingLsId
      ? await supabase.from("lunch_sauces").update(payload).eq("id", editingLsId)
      : await supabase.from("lunch_sauces").insert(payload);
    setLsSaving(false);
    if (result.error) { Alert.alert("Save failed", result.error.message); return; }
    resetLsForm();
    await fetchLunchData();
  };

  const handleDeleteLunchSauce = (ls: LunchSauceRow) => {
    Alert.alert("Delete Sauce", `Delete "${ls.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("lunch_sauces").delete().eq("id", ls.id);
          if (error) { Alert.alert("Delete failed", error.message); return; }
          await fetchLunchData();
        },
      },
    ]);
  };

  /* ─────────────────── SIGN OUT ─────────────────── */

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsStaff(false);
    setCategories([]);
    setItems([]);
    setAddOns([]);
    setLunchChoices([]);
    setLunchSauces([]);
  }, []);

  /* ─────────────────── AUTH GATES ─────────────────── */

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
          <StaffLogin onSignedIn={(s) => setSession(s)} />
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

  /* ─────────────────── RENDER HELPERS ─────────────────── */

  const renderItemsTab = () => (
    <>
      {/* Category selector */}
      <View style={styles.card}>
        <GeckosText style={styles.sectionTitle}>Category</GeckosText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((cat) => {
            const active = cat.id === selectedCategoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { setSelectedCategoryId(cat.id); setAddOnsItemId(null); setShowForm(false); }}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
              >
                <GeckosText style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.title}
                </GeckosText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Action row */}
      <View style={styles.rowActions}>
        <Pressable onPress={openCreateItem} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Ionicons name="add" size={16} color="#fff" />
          <GeckosText style={styles.primaryBtnText}>Add Item</GeckosText>
        </Pressable>
      </View>

      {/* Item form */}
      {showForm && (
        <View style={styles.card}>
          <GeckosText style={styles.sectionTitle}>{editingId ? "Edit Item" : "New Item"}</GeckosText>

          <GeckosText style={styles.inputLabel}>Item ID *</GeckosText>
          <TextInput
            style={styles.input}
            value={form.id}
            onChangeText={(v) => setForm((p) => ({ ...p, id: v.toLowerCase().replace(/\s+/g, "-") }))}
            placeholder="grilled-shrimp"
            placeholderTextColor={GeckosColors.mutedText}
            editable={!editingId}
          />

          <GeckosText style={styles.inputLabel}>Name *</GeckosText>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholder="Grilled Shrimp"
            placeholderTextColor={GeckosColors.mutedText}
          />

          <GeckosText style={styles.inputLabel}>Description</GeckosText>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.description}
            onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
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
                onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
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
                onChangeText={(v) => setForm((p) => ({ ...p, choiceCount: v }))}
                placeholder="0"
                placeholderTextColor={GeckosColors.mutedText}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <GeckosText style={styles.inputLabel}>Price Text (for variants)</GeckosText>
          <TextInput
            style={styles.input}
            value={form.priceText}
            onChangeText={(v) => setForm((p) => ({ ...p, priceText: v }))}
            placeholder="1 Taco 3.99 | 2 Tacos 7.49 | 3 Tacos 10.99"
            placeholderTextColor={GeckosColors.mutedText}
          />

          <View style={styles.halfRow}>
            <View style={styles.halfCol}>
              <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
              <TextInput
                style={styles.input}
                value={form.sortOrder}
                onChangeText={(v) => setForm((p) => ({ ...p, sortOrder: v }))}
                placeholder="0"
                placeholderTextColor={GeckosColors.mutedText}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.halfCol, styles.switchCol]}>
              <GeckosText style={styles.inputLabel}>Active</GeckosText>
              <Switch
                value={form.isActive}
                onValueChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                trackColor={{ true: GeckosColors.geckoGreen, false: GeckosColors.border }}
              />
            </View>
          </View>

          {/* Image picker */}
          <GeckosText style={styles.inputLabel}>Photo</GeckosText>
          {form.imageUri ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable
                onPress={() => setForm((p) => ({ ...p, imageUri: null }))}
                style={({ pressed }) => [styles.imageRemoveBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close-circle" size={22} color={GeckosColors.chiliRed} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickImage}
              disabled={uploadingImage}
              style={({ pressed }) => [styles.imagePickBtn, pressed && styles.pressed, uploadingImage && styles.btnDisabled]}
            >
              {uploadingImage ? (
                <ActivityIndicator color={GeckosColors.geckoGreen} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={18} color={GeckosColors.geckoGreen} />
                  <GeckosText style={styles.imagePickText}>Upload Photo</GeckosText>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.formActions}>
            <Pressable onPress={resetItemForm} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
            </Pressable>
            <Pressable
              onPress={handleSaveItem}
              disabled={saving}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, saving && styles.btnDisabled]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save Item</GeckosText>}
            </Pressable>
          </View>
        </View>
      )}

      {/* Add-ons panel */}
      {addOnsItemId && (
        <View style={styles.card}>
          <View style={styles.panelHeader}>
            <View>
              <GeckosText style={styles.sectionTitle}>Add-ons</GeckosText>
              <GeckosText style={styles.panelSub}>{addOnsItemName}</GeckosText>
            </View>
            <View style={styles.panelHeaderRight}>
              <Pressable
                onPress={() => { setShowAddOnForm(true); setEditingAddOnId(null); setAddOnForm(EMPTY_ADDON_FORM); }}
                style={({ pressed }) => [styles.primaryBtn, styles.btnSm, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <GeckosText style={styles.primaryBtnText}>Add</GeckosText>
              </Pressable>
              <Pressable onPress={closeAddOnsPanel} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={16} color={GeckosColors.mutedText} />
              </Pressable>
            </View>
          </View>

          {showAddOnForm && (
            <View style={styles.subForm}>
              <GeckosText style={styles.inputLabel}>Name *</GeckosText>
              <TextInput
                style={styles.input}
                value={addOnForm.name}
                onChangeText={(v) => setAddOnForm((p) => ({ ...p, name: v }))}
                placeholder="Substitute onion rings"
                placeholderTextColor={GeckosColors.mutedText}
              />
              <View style={styles.halfRow}>
                <View style={styles.halfCol}>
                  <GeckosText style={styles.inputLabel}>Price</GeckosText>
                  <TextInput
                    style={styles.input}
                    value={addOnForm.price}
                    onChangeText={(v) => setAddOnForm((p) => ({ ...p, price: v }))}
                    placeholder="0.00"
                    placeholderTextColor={GeckosColors.mutedText}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfCol}>
                  <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
                  <TextInput
                    style={styles.input}
                    value={addOnForm.sortOrder}
                    onChangeText={(v) => setAddOnForm((p) => ({ ...p, sortOrder: v }))}
                    placeholder="0"
                    placeholderTextColor={GeckosColors.mutedText}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.formActions}>
                <Pressable onPress={() => { setShowAddOnForm(false); setEditingAddOnId(null); }} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
                </Pressable>
                <Pressable
                  onPress={handleSaveAddOn}
                  disabled={addOnsSaving}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, addOnsSaving && styles.btnDisabled]}
                >
                  {addOnsSaving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save</GeckosText>}
                </Pressable>
              </View>
            </View>
          )}

          {addOns.length === 0 && !showAddOnForm ? (
            <GeckosText style={styles.emptyText}>No add-ons yet. Tap Add to create one.</GeckosText>
          ) : (
            addOns.map((ao) => (
              <View key={ao.id} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <GeckosText style={styles.itemName}>{ao.name}</GeckosText>
                  <GeckosText style={styles.itemMeta}>
                    ${Number(ao.price).toFixed(2)} · sort: {ao.sort_order}
                  </GeckosText>
                </View>
                <View style={styles.itemButtons}>
                  <Pressable onPress={() => openEditAddOn(ao)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                    <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteAddOn(ao)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Items list */}
      <View style={styles.card}>
        <GeckosText style={styles.sectionTitle}>
          {currentCategory ? currentCategory.title : "Select a category"} ({items.length})
        </GeckosText>
        {loading ? (
          <ActivityIndicator color={GeckosColors.geckoGreen} />
        ) : itemsError ? (
          <GeckosText style={styles.errorText}>{itemsError}</GeckosText>
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
                {item.price != null ? (
                  <GeckosText style={styles.itemMeta}>${Number(item.price).toFixed(2)}</GeckosText>
                ) : null}
                {item.price_text ? (
                  <GeckosText style={styles.itemMeta}>{item.price_text}</GeckosText>
                ) : null}
                {(item.choice_count ?? 0) > 0 ? (
                  <GeckosText style={styles.itemMeta}>Choose {item.choice_count}</GeckosText>
                ) : null}
              </View>
              <View style={styles.itemButtons}>
                {deletingId === item.id ? (
                  <>
                    <Pressable
                      onPress={() => handleConfirmDelete(item)}
                      style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => setDeletingId(null)}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    >
                      <Ionicons name="close" size={16} color={GeckosColors.mutedText} />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => openAddOnsPanel(item)}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    >
                      <Ionicons name="options-outline" size={16} color={GeckosColors.geckoGreen} />
                    </Pressable>
                    <Pressable onPress={() => openEditItem(item)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                    </Pressable>
                    <Pressable onPress={() => handleToggleItemActive(item)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name={item.is_active ? "eye-off-outline" : "eye-outline"} size={16} color={GeckosColors.mutedText} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteItem(item)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );

  const renderCategoriesTab = () => (
    <>
      <View style={styles.rowActions}>
        <Pressable onPress={openCreateCategory} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Ionicons name="add" size={16} color="#fff" />
          <GeckosText style={styles.primaryBtnText}>Add Category</GeckosText>
        </Pressable>
      </View>

      {showCatForm && (
        <View style={styles.card}>
          <GeckosText style={styles.sectionTitle}>{editingCatId ? "Edit Category" : "New Category"}</GeckosText>

          <GeckosText style={styles.inputLabel}>Category ID *</GeckosText>
          <TextInput
            style={styles.input}
            value={catForm.id}
            onChangeText={(v) => setCatForm((p) => ({ ...p, id: v.toLowerCase().replace(/\s+/g, "-") }))}
            placeholder="kid-meals"
            placeholderTextColor={GeckosColors.mutedText}
            editable={!editingCatId}
          />
          <GeckosText style={styles.inputHint}>Use a short slug (e.g. desserts, kid-meals, ala-carte). Cannot be changed later.</GeckosText>

          <GeckosText style={styles.inputLabel}>Title *</GeckosText>
          <TextInput
            style={styles.input}
            value={catForm.title}
            onChangeText={(v) => setCatForm((p) => ({ ...p, title: v }))}
            placeholder="Kid Meals"
            placeholderTextColor={GeckosColors.mutedText}
          />

          <View style={styles.halfRow}>
            <View style={styles.halfCol}>
              <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
              <TextInput
                style={styles.input}
                value={catForm.sortOrder}
                onChangeText={(v) => setCatForm((p) => ({ ...p, sortOrder: v }))}
                placeholder="0"
                placeholderTextColor={GeckosColors.mutedText}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.halfCol, styles.switchCol]}>
              <GeckosText style={styles.inputLabel}>Active</GeckosText>
              <Switch
                value={catForm.isActive}
                onValueChange={(v) => setCatForm((p) => ({ ...p, isActive: v }))}
                trackColor={{ true: GeckosColors.geckoGreen, false: GeckosColors.border }}
              />
            </View>
          </View>

          {/* Category image picker */}
          <GeckosText style={styles.inputLabel}>Photo</GeckosText>
          {catForm.imageUri ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: catForm.imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable
                onPress={() => setCatForm((p) => ({ ...p, imageUri: null }))}
                style={({ pressed }) => [styles.imageRemoveBtn, pressed && styles.pressed]}
              >
                <Ionicons name="close-circle" size={22} color={GeckosColors.chiliRed} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickCategoryImage}
              disabled={uploadingCatImage}
              style={({ pressed }) => [styles.imagePickBtn, pressed && styles.pressed, uploadingCatImage && styles.btnDisabled]}
            >
              {uploadingCatImage ? (
                <ActivityIndicator color={GeckosColors.geckoGreen} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={18} color={GeckosColors.geckoGreen} />
                  <GeckosText style={styles.imagePickText}>Upload Photo</GeckosText>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.formActions}>
            <Pressable onPress={resetCatForm} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
            </Pressable>
            <Pressable
              onPress={handleSaveCategory}
              disabled={catSaving}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, catSaving && styles.btnDisabled]}
            >
              {catSaving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save Category</GeckosText>}
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <GeckosText style={styles.sectionTitle}>All Categories ({categories.length})</GeckosText>
        {categories.length === 0 ? (
          <GeckosText style={styles.emptyText}>No categories found.</GeckosText>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <GeckosText style={styles.itemName}>{cat.title}</GeckosText>
                <GeckosText style={styles.itemMeta}>
                  id: {cat.id} · sort: {cat.sort_order} · {cat.is_active ? "active" : "hidden"}
                </GeckosText>
              </View>
              <View style={styles.itemButtons}>
                <Pressable onPress={() => openEditCategory(cat)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                  <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                </Pressable>
                <Pressable onPress={() => handleToggleCategoryActive(cat)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                  <Ionicons name={cat.is_active ? "eye-off-outline" : "eye-outline"} size={16} color={GeckosColors.mutedText} />
                </Pressable>
                <Pressable onPress={() => handleDeleteCategory(cat)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );

  const renderLunchTab = () => (
    <>
      {lunchLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={GeckosColors.geckoGreen} />
        </View>
      ) : (
        <>
          {/* Lunch Choices */}
          <View style={styles.card}>
            <View style={styles.panelHeader}>
              <GeckosText style={styles.sectionTitle}>Lunch Choices ({lunchChoices.length})</GeckosText>
              <Pressable
                onPress={() => { setShowLcForm(true); setEditingLcId(null); setLcForm(EMPTY_LC_FORM); }}
                style={({ pressed }) => [styles.primaryBtn, styles.btnSm, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <GeckosText style={styles.primaryBtnText}>Add</GeckosText>
              </Pressable>
            </View>

            {showLcForm && (
              <View style={styles.subForm}>
                <GeckosText style={styles.inputLabel}>Choice Name *</GeckosText>
                <TextInput
                  style={styles.input}
                  value={lcForm.name}
                  onChangeText={(v) => setLcForm((p) => ({ ...p, name: v }))}
                  placeholder="Cheese Enchilada"
                  placeholderTextColor={GeckosColors.mutedText}
                />
                <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
                <TextInput
                  style={styles.input}
                  value={lcForm.sortOrder}
                  onChangeText={(v) => setLcForm((p) => ({ ...p, sortOrder: v }))}
                  placeholder="0"
                  placeholderTextColor={GeckosColors.mutedText}
                  keyboardType="number-pad"
                />
                <View style={styles.formActions}>
                  <Pressable onPress={resetLcForm} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                    <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveLunchChoice}
                    disabled={lcSaving}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, lcSaving && styles.btnDisabled]}
                  >
                    {lcSaving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save</GeckosText>}
                  </Pressable>
                </View>
              </View>
            )}

            {lunchChoices.length === 0 && !showLcForm ? (
              <GeckosText style={styles.emptyText}>No lunch choices yet.</GeckosText>
            ) : (
              lunchChoices.map((lc) => (
                <View key={lc.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <GeckosText style={styles.itemName}>{lc.name}</GeckosText>
                    <GeckosText style={styles.itemMeta}>sort: {lc.sort_order}</GeckosText>
                  </View>
                  <View style={styles.itemButtons}>
                    <Pressable onPress={() => openEditLunchChoice(lc)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteLunchChoice(lc)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Lunch Sauces */}
          <View style={styles.card}>
            <View style={styles.panelHeader}>
              <GeckosText style={styles.sectionTitle}>Lunch Sauces ({lunchSauces.length})</GeckosText>
              <Pressable
                onPress={() => { setShowLsForm(true); setEditingLsId(null); setLsForm(EMPTY_LS_FORM); }}
                style={({ pressed }) => [styles.primaryBtn, styles.btnSm, pressed && styles.pressed]}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <GeckosText style={styles.primaryBtnText}>Add</GeckosText>
              </Pressable>
            </View>

            {showLsForm && (
              <View style={styles.subForm}>
                <GeckosText style={styles.inputLabel}>Sauce Name *</GeckosText>
                <TextInput
                  style={styles.input}
                  value={lsForm.name}
                  onChangeText={(v) => setLsForm((p) => ({ ...p, name: v }))}
                  placeholder="White Queso"
                  placeholderTextColor={GeckosColors.mutedText}
                />
                <View style={styles.halfRow}>
                  <View style={styles.halfCol}>
                    <GeckosText style={styles.inputLabel}>Price (upcharge)</GeckosText>
                    <TextInput
                      style={styles.input}
                      value={lsForm.price}
                      onChangeText={(v) => setLsForm((p) => ({ ...p, price: v }))}
                      placeholder="0.50"
                      placeholderTextColor={GeckosColors.mutedText}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <GeckosText style={styles.inputLabel}>Sort Order</GeckosText>
                    <TextInput
                      style={styles.input}
                      value={lsForm.sortOrder}
                      onChangeText={(v) => setLsForm((p) => ({ ...p, sortOrder: v }))}
                      placeholder="0"
                      placeholderTextColor={GeckosColors.mutedText}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <View style={styles.formActions}>
                  <Pressable onPress={resetLsForm} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                    <GeckosText style={styles.secondaryBtnText}>Cancel</GeckosText>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveLunchSauce}
                    disabled={lsSaving}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, lsSaving && styles.btnDisabled]}
                  >
                    {lsSaving ? <ActivityIndicator color="#fff" /> : <GeckosText style={styles.primaryBtnText}>Save</GeckosText>}
                  </Pressable>
                </View>
              </View>
            )}

            {lunchSauces.length === 0 && !showLsForm ? (
              <GeckosText style={styles.emptyText}>No sauces yet.</GeckosText>
            ) : (
              lunchSauces.map((ls) => (
                <View key={ls.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <GeckosText style={styles.itemName}>{ls.name}</GeckosText>
                    <GeckosText style={styles.itemMeta}>
                      ${Number(ls.price).toFixed(2)} upcharge · sort: {ls.sort_order}
                    </GeckosText>
                  </View>
                  <View style={styles.itemButtons}>
                    <Pressable onPress={() => openEditLunchSauce(ls)} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons name="create-outline" size={16} color={GeckosColors.geckoGreen} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteLunchSauce(ls)} style={({ pressed }) => [styles.iconBtnDanger, pressed && styles.pressed]}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </>
  );

  /* ─────────────────── MAIN RENDER ─────────────────── */

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <GeckosText style={styles.headerTitle}>Menu Dashboard</GeckosText>
            </View>
            <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <GeckosText style={styles.secondaryBtnText}>Sign Out</GeckosText>
            </Pressable>
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {(["items", "categories", "lunch"] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = { items: "Items", categories: "Categories", lunch: "Lunch Options" };
              const active = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={({ pressed }) => [styles.tabBtn, active && styles.tabBtnActive, pressed && styles.pressed]}
                >
                  <GeckosText style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {labels[tab]}
                  </GeckosText>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          {activeTab === "items" && renderItemsTab()}
          {activeTab === "categories" && renderCategoriesTab()}
          {activeTab === "lunch" && renderLunchTab()}

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

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
  },
  tabBtnActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  tabBtnTextActive: {
    color: GeckosColors.geckoGreen,
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

  /* Category chips */
  chipRow: { gap: 8, paddingHorizontal: 2 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
  },
  chipActive: { borderColor: GeckosColors.geckoGreen, backgroundColor: "#11231A" },
  chipText: { fontSize: 13, fontWeight: "800", color: GeckosColors.text },
  chipTextActive: { color: GeckosColors.geckoGreen },

  rowActions: { flexDirection: "row", justifyContent: "flex-end" },

  /* Panel header (add-ons / lunch sections) */
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelSub: { fontSize: 12, fontWeight: "600", color: GeckosColors.mutedText, marginTop: 2 },

  subForm: {
    backgroundColor: GeckosColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 12,
    gap: 8,
  },

  /* Form fields */
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 11,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: -6,
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
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  halfRow: { flexDirection: "row", gap: 10 },
  halfCol: { flex: 1, gap: 6 },
  switchCol: { justifyContent: "flex-end", alignItems: "flex-start" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },

  /* Item rows */
  itemRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
    paddingTop: 10,
  },
  itemMain: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: "800", color: GeckosColors.text },
  itemMeta: { fontSize: 12, fontWeight: "600", color: GeckosColors.mutedText },
  itemButtons: { flexDirection: "row", alignItems: "center", gap: 6 },

  /* Buttons */
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
  primaryBtnText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  btnSm: { paddingVertical: 8, paddingHorizontal: 10 },
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
  secondaryBtnText: { fontSize: 13, fontWeight: "800", color: GeckosColors.text },
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

  emptyText: { color: GeckosColors.mutedText, fontWeight: "600", fontSize: 13 },
  errorText: { color: GeckosColors.chiliRed, fontWeight: "600", fontSize: 13 },

  /* Auth screens */
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 12,
  },
  loginTitle: { fontSize: 26, fontWeight: "900", color: GeckosColors.text },
  loginSub: { fontSize: 14, fontWeight: "600", color: GeckosColors.mutedText, marginBottom: 4 },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  stateText: { fontSize: 14, fontWeight: "700", color: GeckosColors.mutedText, textAlign: "center" },

  pressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.6 },

  /* Image picker */
  imagePickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    borderStyle: "dashed",
    paddingVertical: 14,
    backgroundColor: "rgba(20, 143, 26, 0.06)",
  },
  imagePickText: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
  },
  imagePreviewWrap: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: GeckosColors.surface,
    borderRadius: 999,
  },
});
