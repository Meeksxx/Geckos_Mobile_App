import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { useCart } from "@/src/context/CartContext";
import type { AddOn } from "@/src/data/menu";
import { useMenu } from "@/src/context/MenuContext";
import { GeckosColors } from "@/src/theme/colors";

import { AMERICAN_FOOD_IMAGES } from "@/src/constants/American-Food-image";
import { APPETIZER_IMAGES } from "@/src/constants/Appetizers-image";
import { BEVERAGE_IMAGES } from "@/src/constants/Beverages-image";
import { DESSERT_IMAGES } from "@/src/constants/Dessert-image";
import { ENSALADA_IMAGES } from "@/src/constants/Ensaladas-image";
import { FAJITAS_IMAGES } from "@/src/constants/Fajitas-image";
import { HOUSE_SPECIALTIES_IMAGES } from "@/src/constants/House-Specialties-image";
import { KIDS_IMAGES } from "@/src/constants/Kids-image";
import { LOCAL_FAVORITES_IMAGES } from "@/src/constants/Local-Favorites-image";
import { LUNCH_SPECIALS_IMAGES } from "@/src/constants/Lunch-Specials-image";
import { NACHOS_IMAGES } from "@/src/constants/Nachos-image";
import { QUESADILLAS_IMAGES } from "@/src/constants/Quesadillas-image";

const IMAGE_MAP_BY_CATEGORY: Record<string, Record<string, any>> = {
  beverage: BEVERAGE_IMAGES,
  appetizers: APPETIZER_IMAGES,
  ensalada: ENSALADA_IMAGES,
  "lunch-specials": LUNCH_SPECIALS_IMAGES,
  "local-favorites": LOCAL_FAVORITES_IMAGES,
  "house-specialties": HOUSE_SPECIALTIES_IMAGES,
  "american-food": AMERICAN_FOOD_IMAGES,
  fajitas: FAJITAS_IMAGES,
  nachos: NACHOS_IMAGES,
  quesadillas: QUESADILLAS_IMAGES,
  dessert: DESSERT_IMAGES,
  kids: KIDS_IMAGES,
};

type Variant = { label: string; price: number };

function parseVariants(priceText: string): Variant[] {
  const parts = priceText.split("|").map((s) => s.trim());
  const variants: Variant[] = [];

  for (const part of parts) {
    const priceMatch = part.match(/\$?([\d]+\.[\d]{2})\s*$/);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1]);
    const label = part.slice(0, priceMatch.index).replace(/\$/, "").trim();
    variants.push({ label: label || part, price });
  }

  return variants;
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function makeLineKey(input: {
  itemId: string;
  variant?: string;
  selectedAddOns: AddOn[];
  lunchChoices: string[];
  lunchSauces: string[];
  specialInstructions?: string;
}) {
  return JSON.stringify({
    itemId: input.itemId,
    variant: input.variant ?? null,
    addOns: input.selectedAddOns.map((a) => `${a.name}:${a.price}`).sort(),
    lunchChoices: input.lunchChoices,
    lunchSauces: input.lunchSauces,
    notes: (input.specialInstructions ?? "").trim().toLowerCase(),
  });
}

export default function ItemModal() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { addItem } = useCart();
  const { items: allItems, lunchChoices, lunchSauces } = useMenu();

  const item = allItems.find((m) => m.id === itemId);
  const isLunchSpecial = item?.categoryId === "lunch-specials";

  const parsedVariants = useMemo(() => {
    if (!item?.priceText) return [];
    return parseVariants(item.priceText);
  }, [item?.priceText]);

  const variants = isLunchSpecial ? [] : parsedVariants;

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedItemAddOns, setSelectedItemAddOns] = useState<string[]>([]);
  const [selectedLunchChoices, setSelectedLunchChoices] = useState<string[]>([]);
  const [selectedLunchSauces, setSelectedLunchSauces] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!item) {
    return (
      <AppContainer>
        <View style={styles.center}>
          <GeckosText style={styles.errorText}>Item not found</GeckosText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <GeckosText style={styles.backButtonText}>Go Back</GeckosText>
          </Pressable>
        </View>
      </AppContainer>
    );
  }

  // Strip the "–––– Choose X" suffix from lunch special names since the
  // "Choose N" section below already communicates that clearly.
  const displayName =
    (item.choiceCount ?? 0) > 0
      ? item.name.split(/\n|[–—-]{2,}/)[0].trim()
      : item.name;

  const imageMap = IMAGE_MAP_BY_CATEGORY[item.categoryId];
  const image = imageMap?.[item.id];
  const fallbackPrice = item.price ?? parsedVariants[0]?.price ?? 0;
  const variant = variants[selectedVariantIdx];
  const baseUnitPrice = variant ? variant.price : fallbackPrice;

  const chosenMenuAddOns = (item.addOns ?? []).filter((a) =>
    selectedItemAddOns.includes(a.name)
  );
  // Collect sauce add-ons from per-choice selections
  const chosenSauceAddOns = selectedLunchSauces
    .map((name) => lunchSauces.find((s) => s.name === name))
    .filter((s): s is AddOn => !!s);
  const selectedAddOns = [...chosenMenuAddOns, ...chosenSauceAddOns];
  const addOnsUnitPrice = chosenMenuAddOns.reduce((sum, a) => sum + a.price, 0);
  const saucesPrice = chosenSauceAddOns.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = baseUnitPrice + addOnsUnitPrice + saucesPrice;
  const totalPrice = unitPrice * quantity;

  const toggleItemAddOn = (name: string) => {
    setSelectedItemAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const SAUCE_ITEMS = ["enchilada", "burrito"];
  const choiceNeedsSauce = (choice: string) =>
    SAUCE_ITEMS.some((s) => choice.toLowerCase().includes(s));

  const addLunchChoice = (choice: string) => {
    const count = item.choiceCount ?? 0;
    setSelectedLunchChoices((prev) => {
      if (prev.length >= count) {
        Alert.alert("Selection limit", `Choose up to ${count} option(s).`);
        return prev;
      }
      return [...prev, choice];
    });
    // Add empty sauce slot (will be filled by user if needed)
    setSelectedLunchSauces((prev) => [...prev, ""]);
  };

  const removeLunchChoice = (index: number) => {
    setSelectedLunchChoices((prev) => prev.filter((_, i) => i !== index));
    setSelectedLunchSauces((prev) => prev.filter((_, i) => i !== index));
  };

  const setChoiceSauce = (index: number, sauce: string) => {
    setSelectedLunchSauces((prev) => {
      const next = [...prev];
      next[index] = sauce;
      return next;
    });
  };

  const handleAddToCart = () => {
    if ((item.choiceCount ?? 0) > 0 && selectedLunchChoices.length !== item.choiceCount) {
      Alert.alert(
        "Complete lunch selections",
        `Please select exactly ${item.choiceCount} choice(s).`
      );
      return;
    }

    // Validate sauces for enchiladas/burritos
    for (let i = 0; i < selectedLunchChoices.length; i++) {
      if (choiceNeedsSauce(selectedLunchChoices[i]) && !selectedLunchSauces[i]) {
        Alert.alert("Sauce Required", `Please select a sauce for your ${selectedLunchChoices[i]}.`);
        return;
      }
    }

    const trimmedInstructions = specialInstructions.trim() || undefined;
    const selectedVariantLabel = variant?.label;
    const lineKey = makeLineKey({
      itemId: item.id,
      variant: selectedVariantLabel,
      selectedAddOns,
      lunchChoices: selectedLunchChoices,
      lunchSauces: selectedLunchSauces,
      specialInstructions: trimmedInstructions,
    });

    addItem({
      lineKey,
      itemId: item.id,
      name: item.name,
      variant: selectedVariantLabel,
      selectedAddOns,
      lunchChoices: selectedLunchChoices,
      lunchSauces: selectedLunchSauces,
      specialInstructions: trimmedInstructions,
      price: unitPrice,
      quantity,
    });

    router.back();
  };

  return (
    <AppContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={GeckosColors.text} />
        </Pressable>

        {image ? (
          <View style={styles.imageWrap}>
            <Image source={image} style={styles.image} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="restaurant-outline"
              size={48}
              color={GeckosColors.mutedText}
            />
          </View>
        )}

        <GeckosText style={styles.itemName}>{displayName}</GeckosText>

        {item.description ? (
          <GeckosText style={styles.description}>{item.description}</GeckosText>
        ) : null}

        {variants.length > 0 ? (
          <View style={styles.section}>
            <GeckosText style={styles.sectionLabel}>Options</GeckosText>
            <View style={styles.optionList}>
              {variants.map((v, idx) => (
                <Pressable
                  key={v.label}
                  onPress={() => setSelectedVariantIdx(idx)}
                  style={[
                    styles.optionChip,
                    idx === selectedVariantIdx && styles.optionChipSelected,
                  ]}
                >
                  <GeckosText
                    style={[
                      styles.optionLabel,
                      idx === selectedVariantIdx && styles.optionLabelSelected,
                    ]}
                  >
                    {v.label}
                  </GeckosText>
                  <GeckosText
                    style={[
                      styles.optionPrice,
                      idx === selectedVariantIdx && styles.optionLabelSelected,
                    ]}
                  >
                    {money(v.price)}
                  </GeckosText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : !isLunchSpecial && fallbackPrice > 0 ? (
          <GeckosText style={styles.simplePrice}>{money(fallbackPrice)}</GeckosText>
        ) : null}

        {(item.addOns ?? []).length > 0 ? (
          <View style={styles.section}>
            <GeckosText style={styles.sectionLabel}>Add-ons</GeckosText>
            <View style={styles.optionList}>
              {(item.addOns ?? []).map((addOn) => {
                const selected = selectedItemAddOns.includes(addOn.name);
                return (
                  <Pressable
                    key={addOn.name}
                    onPress={() => toggleItemAddOn(addOn.name)}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                  >
                    <GeckosText style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {addOn.name}
                    </GeckosText>
                    <GeckosText style={[styles.optionPrice, selected && styles.optionLabelSelected]}>
                      +{money(addOn.price)}
                    </GeckosText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {(item.choiceCount ?? 0) > 0 ? (
          <View style={styles.section}>
            <View style={styles.choiceHeader}>
              <GeckosText style={[styles.sectionLabel, { marginBottom: 0 }]}>
                Choose {item.choiceCount}
              </GeckosText>
              <View style={[
                styles.choiceProgress,
                selectedLunchChoices.length === item.choiceCount && styles.choiceProgressDone,
              ]}>
                <GeckosText style={[
                  styles.choiceProgressText,
                  selectedLunchChoices.length === item.choiceCount && styles.choiceProgressTextDone,
                ]}>
                  {selectedLunchChoices.length} / {item.choiceCount} selected
                </GeckosText>
              </View>
            </View>
            <GeckosText style={styles.sectionHelp}>
              Tap to select. You can pick the same item more than once.
            </GeckosText>

            {/* Current selections with per-item sauce pickers */}
            {selectedLunchChoices.length > 0 && (
              <View style={styles.selectedChoicesList}>
                {selectedLunchChoices.map((choice, idx) => (
                  <View key={`${choice}-${idx}`} style={styles.selectedChoiceCard}>
                    <View style={styles.selectedChoiceHeader}>
                      <GeckosText style={styles.selectedChoiceText}>{choice}</GeckosText>
                      <Pressable onPress={() => removeLunchChoice(idx)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={GeckosColors.chiliRed} />
                      </Pressable>
                    </View>
                    {choiceNeedsSauce(choice) && (
                      <View style={styles.saucePickerWrap}>
                        <GeckosText style={styles.saucePickerLabel}>Sauce:</GeckosText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sauceScroll}>
                          <View style={styles.sauceRow}>
                            {lunchSauces.map((sauce) => {
                              const isSelected = selectedLunchSauces[idx] === sauce.name;
                              return (
                                <Pressable
                                  key={sauce.name}
                                  onPress={() => setChoiceSauce(idx, sauce.name)}
                                  style={[styles.saucePill, isSelected && styles.saucePillSelected]}
                                >
                                  <GeckosText style={[styles.saucePillText, isSelected && styles.saucePillTextSelected]}>
                                    {sauce.name}{sauce.price > 0 ? ` +${money(sauce.price)}` : ""}
                                  </GeckosText>
                                </Pressable>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Available choices */}
            <View style={styles.choiceWrap}>
              {lunchChoices.map((choice) => {
                const disabled = selectedLunchChoices.length >= (item.choiceCount ?? 0);
                return (
                  <Pressable
                    key={choice}
                    onPress={() => addLunchChoice(choice)}
                    style={[styles.choiceChip, disabled && styles.choiceChipDisabled]}
                  >
                    <GeckosText style={[styles.choiceText, disabled && styles.choiceTextDisabled]}>
                      {choice}
                    </GeckosText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <GeckosText style={styles.sectionLabel}>Special Instructions</GeckosText>
          <TextInput
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="No tomatoes, ketchup only, etc."
            placeholderTextColor={GeckosColors.mutedText}
            style={styles.instructionsInput}
            multiline
            maxLength={180}
          />
        </View>

        <View style={styles.section}>
          <GeckosText style={styles.sectionLabel}>Quantity</GeckosText>
          <View style={styles.quantityRow}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
            >
              <Ionicons name="remove" size={22} color={GeckosColors.text} />
            </Pressable>
            <GeckosText style={styles.qtyText}>{quantity}</GeckosText>
            <Pressable
              onPress={() => setQuantity((q) => q + 1)}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={22} color={GeckosColors.text} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleAddToCart}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Ionicons name="cart-outline" size={20} color={GeckosColors.background} />
          <GeckosText style={styles.addButtonText}>Add to Cart - {money(totalPrice)}</GeckosText>
        </Pressable>
      </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: GeckosColors.text,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pressed: { opacity: 0.7 },

  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  itemName: {
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    lineHeight: 22,
    marginBottom: 10,
  },
  simplePrice: {
    fontSize: 22,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
    marginBottom: 8,
  },

  section: {
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionHelp: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginBottom: 10,
  },
  choiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  choiceProgress: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  choiceProgressDone: {
    backgroundColor: "rgba(20, 143, 26, 0.12)",
    borderColor: GeckosColors.geckoGreen,
  },
  choiceProgressText: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  choiceProgressTextDone: {
    color: GeckosColors.geckoGreen,
  },
  optionList: {
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: GeckosColors.surface,
    borderWidth: 2,
    borderColor: GeckosColors.border,
  },
  optionChipSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(20, 143, 26, 0.1)",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: GeckosColors.text,
    flexShrink: 1,
    paddingRight: 8,
  },
  optionLabelSelected: {
    color: GeckosColors.geckoGreen,
  },
  optionPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },

  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceChipSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(20, 143, 26, 0.1)",
  },
  choiceChipDisabled: {
    opacity: 0.4,
  },
  choiceText: {
    color: GeckosColors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  choiceTextDisabled: {
    color: GeckosColors.mutedText,
  },
  selectedChoicesList: {
    gap: 10,
    marginBottom: 12,
  },
  selectedChoiceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(20, 143, 26, 0.06)",
    padding: 12,
  },
  selectedChoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedChoiceText: {
    color: GeckosColors.geckoGreen,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  saucePickerWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(20, 143, 26, 0.15)",
  },
  saucePickerLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sauceScroll: {
    marginHorizontal: -4,
  },
  sauceRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 4,
  },
  saucePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saucePillSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(20, 143, 26, 0.15)",
  },
  saucePillText: {
    color: GeckosColors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  saucePillTextSelected: {
    color: GeckosColors.geckoGreen,
  },

  instructionsInput: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: GeckosColors.text,
    fontSize: 15,
    fontWeight: "600",
    minHeight: 90,
    textAlignVertical: "top",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 22,
    fontWeight: "900",
    color: GeckosColors.text,
    minWidth: 32,
    textAlign: "center",
  },

  bottomBar: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.background,
  },
});
