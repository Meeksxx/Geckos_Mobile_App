import React, { useEffect, useState } from "react";
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
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";
import { REWARDS, type RewardConfig } from "@/src/config/rewards";

const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

type OrderState = "cart" | "submitting";

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const handleRemove = () => {
    Alert.alert(
      "Remove item?",
      `Remove "${item.name}" from your order?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onRemove },
      ]
    );
  };

  return (
    <View style={styles.cartItem}>
      {/* Top: name/details + trash icon separated at far right */}
      <View style={styles.cartItemHeader}>
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
          {(item.lunchChoices ?? []).length > 0
            ? (item.lunchChoices ?? []).map((choice, idx) => {
                const sauce = (item.lunchSauces ?? [])[idx];
                return (
                  <GeckosText key={`${choice}-${idx}`} style={styles.cartItemDetail}>
                    {choice}{sauce ? ` (${sauce})` : ""}
                  </GeckosText>
                );
              })
            : null}
          {item.specialInstructions ? (
            <GeckosText style={styles.cartItemDetail}>
              Note: {item.specialInstructions}
            </GeckosText>
          ) : null}
        </View>

        <Pressable
          onPress={handleRemove}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Ionicons name="trash-outline" size={18} color={GeckosColors.chiliRed} />
        </Pressable>
      </View>

      {/* Bottom: qty controls + line price */}
      <View style={styles.cartItemFooter}>
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
      <Pressable
        onPress={() => router.push("/orders" as any)}
        style={({ pressed }) => [styles.historyButton, pressed && styles.buttonPressed]}
      >
        <Ionicons name="receipt-outline" size={18} color={GeckosColors.geckoGreen} />
        <GeckosText style={styles.historyButtonText}>View Order History</GeckosText>
      </Pressable>
    </View>
  );
}

const STATUS_STEPS = [
  { key: "new", label: "Order Received", icon: "receipt-outline" as const },
  { key: "accepted", label: "Accepted", icon: "checkmark-circle-outline" as const },
  { key: "preparing", label: "Preparing", icon: "flame-outline" as const },
  { key: "ready", label: "Ready for Pickup", icon: "bag-check-outline" as const },
  { key: "picked_up", label: "Picked Up", icon: "checkmark-done-outline" as const },
];

function OrderTracker({
  orderId,
  onDone,
  onClose,
}: {
  orderId: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("new");

  useEffect(() => {
    // Fetch initial status — if order no longer exists, clear the tracker
    supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { onDone(); return; }
        if (data.status) setStatus(data.status);
      });

    // Subscribe to realtime updates (update + delete)
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new?.status) setStatus(payload.new.status as string);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => { onDone(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onDone]);

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  const isCancelled = status === "cancelled";
  const isPickedUp = status === "picked_up";

  return (
    <ScrollView contentContainerStyle={styles.trackerContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.confirmedIconWrap}>
        <Ionicons
          name={isCancelled ? "close-circle" : isPickedUp ? "checkmark-done-circle" : "time-outline"}
          size={56}
          color={isCancelled ? GeckosColors.chiliRed : GeckosColors.geckoGreen}
        />
      </View>

      <GeckosText style={styles.confirmedTitle}>
        {isCancelled ? "Order Cancelled" : isPickedUp ? "Order Complete!" : "Order In Progress"}
      </GeckosText>
      <GeckosText style={styles.confirmedBody}>
        {isCancelled
          ? "Your order has been cancelled. Please contact the restaurant if you have questions."
          : isPickedUp
          ? "Thanks for ordering from Gecko's! Enjoy your meal."
          : "We're working on your order. Status updates appear in real time."}
      </GeckosText>

      {!isCancelled && (
        <View style={styles.statusTimeline}>
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <View key={step.key} style={styles.statusStep}>
                <View style={styles.statusStepIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      isCompleted && styles.statusDotCompleted,
                      isActive && styles.statusDotActive,
                    ]}
                  >
                    <Ionicons
                      name={step.icon}
                      size={16}
                      color={isCompleted ? "#fff" : GeckosColors.mutedText}
                    />
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.statusLine,
                        idx < currentIdx && styles.statusLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <GeckosText
                  style={[
                    styles.statusLabel,
                    isCompleted && styles.statusLabelCompleted,
                    isActive && styles.statusLabelActive,
                  ]}
                >
                  {step.label}
                </GeckosText>
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={isPickedUp || isCancelled ? onDone : onClose}
        style={({ pressed }) => [styles.browseButton, pressed && styles.buttonPressed]}
      >
        <GeckosText style={styles.browseButtonText}>
          {isPickedUp || isCancelled ? "Done" : "Close Tracker"}
        </GeckosText>
      </Pressable>
    </ScrollView>
  );
}

export default function OrderScreen() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const { session, profile, isLoggedIn } = useAuth();
  const [orderState, setOrderState] = useState<OrderState>("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState<boolean | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardConfig | null>(null);


  // Pre-fill name and phone from profile when user signs in
  useEffect(() => {
    if (profile && !profileLoaded) {
      setCustomerName(profile.display_name);
      setCustomerPhone(profile.phone);
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Fetch user's points balance so we can show eligible rewards
  useEffect(() => {
    if (!session?.user?.id) { setUserPoints(null); return; }
    supabase
      .from("customer_points")
      .select("total_points")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setUserPoints(data?.total_points ?? 0));
  }, [session?.user?.id]);

  // Check if restaurant is accepting orders, and keep it live
  useEffect(() => {
    supabase.rpc("is_accepting_orders").then(({ data }) => {
      setAcceptingOrders(data ?? false);
    });

    const channel = supabase
      .channel("kitchen-days-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_days" },
        () => {
          supabase.rpc("is_accepting_orders").then(({ data }) => {
            setAcceptingOrders(data ?? false);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCall = () => {
    if (Platform.OS === "ios" && Platform.isPad) {
      Alert.alert("Call Gecko's", PHONE_DISPLAY, [{ text: "OK" }]);
      return;
    }
    Linking.openURL(`tel:${PHONE_DIAL}`);
  };

  const notAcceptingBanner = acceptingOrders === false ? (
    <View style={styles.closedBanner}>
      <Ionicons name="close-circle" size={22} color="#fff" />
      <View style={styles.closedBannerText}>
        <GeckosText style={styles.closedBannerTitle}>Not Accepting Orders</GeckosText>
        <GeckosText style={styles.closedBannerBody}>
          We&apos;re not taking online orders right now. Call us to place an order.
        </GeckosText>
      </View>
      <Pressable onPress={handleCall} style={styles.closedCallBtn} hitSlop={8}>
        <Ionicons name="call" size={20} color="#fff" />
      </Pressable>
    </View>
  ) : null;

  const handlePlaceOrder = () => {
    if (!isLoggedIn) {
      router.push("/auth" as any);
      return;
    }
    if (!customerName.trim()) {
      Alert.alert("Name Required", "Please enter your name for the order.");
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert("Phone Required", "Please enter a phone number so we can reach you.");
      return;
    }
    // Order insert + payment handled in checkout.tsx
    router.push({
      pathname: "/checkout",
      params: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupTime: pickupTime.trim(),
        rewardId: selectedReward?.id ?? "",
        rewardLabel: selectedReward?.label ?? "",
        rewardPoints: String(selectedReward?.points ?? 0),
        rewardDiscountCents: String(selectedReward?.discountCents ?? 0),
      },
    } as any);
  };


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
              {notAcceptingBanner}

            {/* Header */}
            <View style={styles.screenTitleRow}>
              <GeckosText style={styles.screenTitle}>Your Order</GeckosText>
              <Pressable
                onPress={() => router.push("/orders" as any)}
                style={({ pressed }) => [styles.historyLink, pressed && styles.buttonPressed]}
              >
                <Ionicons name="receipt-outline" size={15} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.historyLinkText}>History</GeckosText>
              </Pressable>
            </View>

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

            {/* Subtotal (with optional reward discount) */}
            <View style={styles.subtotalRow}>
              <GeckosText style={styles.subtotalLabel}>Subtotal</GeckosText>
              <GeckosText style={[styles.subtotalValue, selectedReward && styles.subtotalStrikethrough]}>
                ${subtotal.toFixed(2)}
              </GeckosText>
            </View>
            {selectedReward && (
              <>
                <View style={styles.discountRow}>
                  <GeckosText style={styles.discountLabel}>{selectedReward.label}</GeckosText>
                  <GeckosText style={styles.discountValue}>
                    -${(selectedReward.discountCents / 100).toFixed(2)}
                  </GeckosText>
                </View>
                <View style={styles.subtotalRow}>
                  <GeckosText style={styles.subtotalLabel}>After Reward</GeckosText>
                  <GeckosText style={styles.subtotalValue}>
                    ${Math.max(0, subtotal - selectedReward.discountCents / 100).toFixed(2)}
                  </GeckosText>
                </View>
              </>
            )}

            <View style={styles.divider} />

            {/* Reward selector — shown only when logged in with eligible rewards */}
            {isLoggedIn && userPoints !== null && REWARDS.some((r) => userPoints >= r.points) && (
              <View style={styles.rewardSection}>
                <View style={styles.rewardSectionHeader}>
                  <Ionicons name="star" size={15} color={GeckosColors.geckoGreen} />
                  <GeckosText style={styles.rewardSectionTitle}>Redeem a Reward</GeckosText>
                  <GeckosText style={styles.rewardSectionPts}>{userPoints} pts</GeckosText>
                </View>
                {REWARDS.filter((r) => userPoints >= r.points).map((reward) => {
                  const selected = selectedReward?.id === reward.id;
                  return (
                    <Pressable
                      key={reward.id}
                      onPress={() => setSelectedReward(selected ? null : reward)}
                      style={({ pressed }) => [
                        styles.rewardChip,
                        selected && styles.rewardChipSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons
                        name={reward.icon as any}
                        size={18}
                        color={selected ? GeckosColors.geckoGreen : GeckosColors.mutedText}
                      />
                      <View style={styles.rewardChipInfo}>
                        <GeckosText style={[styles.rewardChipLabel, selected && styles.rewardChipLabelSelected]}>
                          {reward.label}
                        </GeckosText>
                        <GeckosText style={styles.rewardChipDiscount}>
                          {reward.points} pts · -${(reward.discountCents / 100).toFixed(2)} off
                        </GeckosText>
                      </View>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={20} color={GeckosColors.geckoGreen} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {!isLoggedIn ? (
              <View style={styles.signInPrompt}>
                <Ionicons name="person-circle-outline" size={36} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.signInPromptTitle}>Sign in to place your order</GeckosText>
                <GeckosText style={styles.signInPromptBody}>
                  Create an account or sign in so we can link your order to you.
                </GeckosText>
                <Pressable
                  onPress={() => router.push("/auth" as any)}
                  style={({ pressed }) => [styles.signInButton, pressed && styles.buttonPressed]}
                >
                  <GeckosText style={styles.signInButtonText}>Sign In / Sign Up</GeckosText>
                </Pressable>
              </View>
            ) : (
              <>
                {profile?.display_name && profile?.phone ? (
                  /* Profile complete — show compact summary */
                  <View style={styles.profileSummaryCard}>
                    <View style={styles.profileSummaryRow}>
                      <Ionicons name="person-circle" size={36} color={GeckosColors.geckoGreen} />
                      <View style={styles.profileSummaryInfo}>
                        <GeckosText style={styles.profileSummaryName}>{customerName}</GeckosText>
                        <GeckosText style={styles.profileSummaryPhone}>{customerPhone}</GeckosText>
                      </View>
                    </View>
                    <View style={styles.profileSummaryDivider} />
                    <GeckosText style={styles.inputLabel}>Pickup Time (optional)</GeckosText>
                    <View style={styles.pickupChips}>
                      {["Here Now", "ASAP", "15 min", "30 min", "45 min"].map((opt) => (
                        <Pressable
                          key={opt}
                          onPress={() => setPickupTime(pickupTime === opt ? "" : opt)}
                          style={({ pressed }) => [
                            styles.pickupChip,
                            pickupTime === opt && styles.pickupChipSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <GeckosText style={[styles.pickupChipText, pickupTime === opt && styles.pickupChipTextSelected]}>
                            {opt}
                          </GeckosText>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={["Here Now", "ASAP", "15 min", "30 min", "45 min"].includes(pickupTime) ? "" : pickupTime}
                      onChangeText={setPickupTime}
                      placeholder="Or enter a specific time…"
                      placeholderTextColor={GeckosColors.mutedText}
                      returnKeyType="done"
                    />
                  </View>
                ) : (
                  /* Profile incomplete — show full form */
                  <>
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
                    <View style={styles.pickupChips}>
                      {["Here Now", "ASAP", "15 min", "30 min", "45 min"].map((opt) => (
                        <Pressable
                          key={opt}
                          onPress={() => setPickupTime(pickupTime === opt ? "" : opt)}
                          style={({ pressed }) => [
                            styles.pickupChip,
                            pickupTime === opt && styles.pickupChipSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <GeckosText style={[styles.pickupChipText, pickupTime === opt && styles.pickupChipTextSelected]}>
                            {opt}
                          </GeckosText>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={["Here Now", "ASAP", "15 min", "30 min", "45 min"].includes(pickupTime) ? "" : pickupTime}
                      onChangeText={setPickupTime}
                      placeholder="Or enter a specific time…"
                      placeholderTextColor={GeckosColors.mutedText}
                      returnKeyType="done"
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Place order button (only when signed in) */}
          {isLoggedIn && (
            <View style={styles.bottomBar}>
              <Pressable
                onPress={handlePlaceOrder}
                disabled={orderState === "submitting" || acceptingOrders === false}
                style={({ pressed }) => [
                  styles.placeOrderButton,
                  pressed && styles.buttonPressed,
                  (orderState === "submitting" || acceptingOrders === false) && styles.buttonDisabled,
                ]}
              >
                <Ionicons
                  name={acceptingOrders === false ? "ban-outline" : "checkmark-circle-outline"}
                  size={20}
                  color={GeckosColors.background}
                />
                <GeckosText style={styles.placeOrderText}>
                  {acceptingOrders === false
                    ? "Not Accepting Orders"
                    : selectedReward
                    ? `Continue to Payment — $${Math.max(0, subtotal - selectedReward.discountCents / 100).toFixed(2)}`
                    : `Continue to Payment — $${subtotal.toFixed(2)}`}
                </GeckosText>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  screenTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(74, 222, 128, 0.06)",
  },
  historyLinkText: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(74, 222, 128, 0.06)",
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },

  // Cart items
  cartList: {
    gap: 12,
  },
  cartItem: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 12,
    gap: 10,
  },
  cartItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
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
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
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
    minWidth: 24,
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

  // Profile summary card
  profileSummaryCard: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 16,
    gap: 14,
  },
  profileSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileSummaryInfo: {
    flex: 1,
    gap: 2,
  },
  profileSummaryName: {
    fontSize: 16,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  profileSummaryPhone: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  profileSummaryDivider: {
    height: 1,
    backgroundColor: GeckosColors.border,
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

  // Discount row
  subtotalStrikethrough: {
    fontSize: 20,
    fontWeight: "900",
    color: GeckosColors.mutedText,
    textDecorationLine: "line-through",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 6,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
    flex: 1,
  },
  discountValue: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },

  // Reward selector
  rewardSection: {
    gap: 10,
    marginBottom: 4,
  },
  rewardSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.text,
    flex: 1,
  },
  rewardSectionPts: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 12,
  },
  rewardChipSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(74, 222, 128, 0.07)",
  },
  rewardChipInfo: {
    flex: 1,
    gap: 2,
  },
  rewardChipLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  rewardChipLabelSelected: {
    color: GeckosColors.geckoGreen,
  },
  rewardChipDiscount: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },

  // Pickup time chips
  pickupChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  pickupChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
  },
  pickupChipSelected: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
  },
  pickupChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  pickupChipTextSelected: {
    color: GeckosColors.geckoGreen,
  },

  // Closed / not accepting orders banner
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GeckosColors.chiliRed,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  closedBannerText: {
    flex: 1,
    gap: 2,
  },
  closedBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  closedBannerBody: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  closedCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  activeOrderBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
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

  // Sign in prompt
  signInPrompt: {
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
  signInPromptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text,
    textAlign: "center",
  },
  signInPromptBody: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  signInButtonText: {
    fontSize: 16,
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

  // Order tracker
  trackerContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  statusTimeline: {
    width: "100%",
    marginTop: 28,
    marginBottom: 28,
    gap: 0,
  },
  statusStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  statusStepIndicator: {
    alignItems: "center",
    width: 32,
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GeckosColors.surface,
    borderWidth: 2,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotCompleted: {
    backgroundColor: GeckosColors.geckoGreen,
    borderColor: GeckosColors.geckoGreen,
  },
  statusDotActive: {
    borderColor: GeckosColors.geckoGreen,
    shadowColor: GeckosColors.geckoGreen,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  statusLine: {
    width: 2,
    height: 24,
    backgroundColor: GeckosColors.border,
    alignSelf: "center",
  },
  statusLineCompleted: {
    backgroundColor: GeckosColors.geckoGreen,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    paddingTop: 6,
  },
  statusLabelCompleted: {
    color: GeckosColors.text,
  },
  statusLabelActive: {
    color: GeckosColors.geckoGreen,
    fontWeight: "800",
  },
});
