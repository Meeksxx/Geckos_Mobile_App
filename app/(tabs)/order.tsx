import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { useCart, CartItem } from "@/src/context/CartContext";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";

const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

type OrderState = "cart" | "submitting" | "confirmed";

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <GeckosText style={styles.cartItemName}>{item.name}</GeckosText>
        {item.variant ? (
          <GeckosText style={styles.cartItemVariant}>{item.variant}</GeckosText>
        ) : null}
        {(item.selectedAddOns ?? []).map((addOn) => (
          <GeckosText key={addOn.name} style={styles.cartItemDetail}>
            + {addOn.name}
            {addOn.price > 0 ? ` ($${addOn.price.toFixed(2)})` : ""}
          </GeckosText>
        ))}
        {(item.lunchChoices ?? []).length > 0 ? (
          <GeckosText style={styles.cartItemDetail}>
            Lunch choices: {(item.lunchChoices ?? []).join(", ")}
          </GeckosText>
        ) : null}
        {item.lunchSauce ? (
          <GeckosText style={styles.cartItemDetail}>
            Sauce: {item.lunchSauce}
          </GeckosText>
        ) : null}
        {item.specialInstructions ? (
          <GeckosText style={styles.cartItemDetail}>
            Note: {item.specialInstructions}
          </GeckosText>
        ) : null}
      </View>

      <View style={styles.cartItemActions}>
        <View style={styles.qtyRow}>
          <Pressable
            onPress={() => onUpdateQty(item.quantity - 1)}
            style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
          >
            <Ionicons name="remove" size={16} color={GeckosColors.text} />
          </Pressable>
          <GeckosText style={styles.qtyText}>{item.quantity}</GeckosText>
          <Pressable
            onPress={() => onUpdateQty(item.quantity + 1)}
            style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color={GeckosColors.text} />
          </Pressable>
        </View>

        <GeckosText style={styles.linePrice}>
          ${(item.price * item.quantity).toFixed(2)}
        </GeckosText>
      </View>

      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color={GeckosColors.chiliRed} />
      </Pressable>
    </View>
  );
}

function EmptyCart() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="cart-outline" size={56} color={GeckosColors.geckoGreen} />
      </View>
      <GeckosText style={styles.emptyTitle}>Your cart is empty</GeckosText>
      <GeckosText style={styles.emptyBody}>
        Browse the menu and add some items to get started.
      </GeckosText>
      <Pressable
        onPress={() => router.navigate("/(tabs)/menu")}
        style={({ pressed }) => [styles.browseButton, pressed && styles.buttonPressed]}
      >
        <Ionicons name="restaurant-outline" size={20} color={GeckosColors.background} />
        <GeckosText style={styles.browseButtonText}>Browse Menu</GeckosText>
      </Pressable>
    </View>
  );
}

function OrderConfirmed({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.confirmedIconWrap}>
        <Ionicons name="checkmark-circle" size={64} color={GeckosColors.geckoGreen} />
      </View>
      <GeckosText style={styles.confirmedTitle}>Order Placed!</GeckosText>
      <GeckosText style={styles.confirmedBody}>
        Your order has been received. We will have it ready for pickup soon!
      </GeckosText>
      <Pressable
        onPress={onDone}
        style={({ pressed }) => [styles.browseButton, pressed && styles.buttonPressed]}
      >
        <GeckosText style={styles.browseButtonText}>Done</GeckosText>
      </Pressable>
    </View>
  );
}

export default function OrderScreen() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const [orderState, setOrderState] = useState<OrderState>("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const handleCall = () => {
    if (Platform.OS === "ios" && Platform.isPad) {
      Alert.alert("Call Gecko's", PHONE_DISPLAY, [{ text: "OK" }]);
      return;
    }
    Linking.openURL(`tel:${PHONE_DIAL}`);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert("Name Required", "Please enter your name for the order.");
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert("Phone Required", "Please enter a phone number so we can reach you.");
      return;
    }

    setOrderState("submitting");

    try {
      const { error } = await supabase.from("orders").insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        pickup_time: pickupTime.trim() || null,
        status: "new",
        items: items.map((i) => ({
          lineKey: i.lineKey,
          itemId: i.itemId,
          name: i.name,
          variant: i.variant,
          selectedAddOns: i.selectedAddOns ?? [],
          lunchChoices: i.lunchChoices ?? [],
          lunchSauce: i.lunchSauce ?? null,
          specialInstructions: i.specialInstructions ?? null,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal: Math.round(subtotal * 100) / 100,
      });

      if (error) throw error;

      setOrderState("confirmed");
    } catch (error: any) {
      setOrderState("cart");
      const details = [error?.code, error?.message].filter(Boolean).join(": ");
      Alert.alert(
        "Order Failed",
        details
          ? `Could not place order. ${details}`
          : "Something went wrong placing your order. Please try again or call us directly.",
        [
          { text: "Try Again" },
          { text: "Call Us", onPress: handleCall },
        ]
      );
    }
  };

  const handleDone = () => {
    clearCart();
    setCustomerName("");
    setCustomerPhone("");
    setPickupTime("");
    setOrderState("cart");
  };

  if (orderState === "confirmed") {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <OrderConfirmed onDone={handleDone} />
        </AppContainer>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <StatusBar style="light" />
        <AppContainer>
          <EmptyCart />
        </AppContainer>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <GeckosText style={styles.screenTitle}>Your Order</GeckosText>

            {/* Cart items */}
            <View style={styles.cartList}>
              {items.map((item) => (
                <CartItemRow
                  key={item.lineKey}
                  item={item}
                  onRemove={() => removeItem(item.lineKey)}
                  onUpdateQty={(qty) => updateQuantity(item.lineKey, qty)}
                />
              ))}
            </View>

            {/* Subtotal */}
            <View style={styles.subtotalRow}>
              <GeckosText style={styles.subtotalLabel}>Subtotal</GeckosText>
              <GeckosText style={styles.subtotalValue}>
                ${subtotal.toFixed(2)}
              </GeckosText>
            </View>

            <View style={styles.divider} />

            {/* Checkout form */}
            <GeckosText style={styles.formTitle}>Pickup Details</GeckosText>

            <GeckosText style={styles.inputLabel}>Name *</GeckosText>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Your name"
              placeholderTextColor={GeckosColors.mutedText}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <GeckosText style={styles.inputLabel}>Phone *</GeckosText>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="(555) 555-5555"
              placeholderTextColor={GeckosColors.mutedText}
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            <GeckosText style={styles.inputLabel}>Pickup Time (optional)</GeckosText>
            <TextInput
              style={styles.input}
              value={pickupTime}
              onChangeText={setPickupTime}
              placeholder="e.g. 6:30 PM"
              placeholderTextColor={GeckosColors.mutedText}
              returnKeyType="done"
            />
          </ScrollView>

          {/* Place order button */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={handlePlaceOrder}
              disabled={orderState === "submitting"}
              style={({ pressed }) => [
                styles.placeOrderButton,
                pressed && styles.buttonPressed,
                orderState === "submitting" && styles.buttonDisabled,
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={GeckosColors.background} />
              <GeckosText style={styles.placeOrderText}>
                {orderState === "submitting" ? "Placing Order..." : `Place Order — $${subtotal.toFixed(2)}`}
              </GeckosText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 20,
  },

  // Cart items
  cartList: {
    gap: 12,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 12,
    gap: 12,
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  cartItemVariant: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  cartItemDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
    lineHeight: 16,
  },
  cartItemActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: GeckosColors.background,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.text,
    minWidth: 20,
    textAlign: "center",
  },
  linePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
  },
  removeBtn: {
    padding: 4,
  },
  pressed: { opacity: 0.7 },

  // Subtotal
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  subtotalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  subtotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },

  divider: {
    height: 1,
    backgroundColor: GeckosColors.border,
    marginVertical: 20,
  },

  // Form
  formTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.text,
  },

  // Bottom bar
  bottomBar: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
  },
  placeOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  placeOrderText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Empty cart
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconWrap: {
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
  emptyTitle: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  browseButton: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  browseButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.background,
  },

  // Confirmed
  confirmedIconWrap: {
    marginBottom: 8,
  },
  confirmedTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
    textAlign: "center",
  },
  confirmedBody: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
});
