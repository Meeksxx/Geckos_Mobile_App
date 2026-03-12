// app/checkout.tsx — Payment selection modal
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useStripe } from "@/src/hooks/useAppStripe";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { supabase } from "@/src/lib/supabase";

/* ─── Config ─────────────────────────────────────────────── */

const EDGE_URL =
  `${(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/functions/v1/create-payment-intent`;

/* ─── Screen ─────────────────────────────────────────────── */

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { session } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const params = useLocalSearchParams<{
    customerName: string;
    customerPhone: string;
    pickupTime: string;
    rewardId?: string;
    rewardLabel?: string;
    rewardPoints?: string;
    rewardDiscountCents?: string;
  }>();

  const [loading, setLoading] = useState(false);

  /* ── Fee calculations ─────────────────────────────────── */
  const rewardDiscountCents = Number(params.rewardDiscountCents ?? 0);
  const subtotalCents = Math.round(subtotal * 100);
  const discountedSubtotalCents = Math.max(0, subtotalCents - rewardDiscountCents);
  const processingFeeCents = Math.round(discountedSubtotalCents * 0.029) + 30; // 2.9% + $0.30
  const serviceFeeCents = Math.round(discountedSubtotalCents * 0.015);         // 1.5% customer share
  const totalCents = discountedSubtotalCents + processingFeeCents + serviceFeeCents;
  const discountAmount = rewardDiscountCents / 100;
  const discountedSubtotal = discountedSubtotalCents / 100;
  const processingFee = processingFeeCents / 100;
  const serviceFee = serviceFeeCents / 100;
  const total = totalCents / 100;

  /* ── Shared order payload ─────────────────────────────── */
  function buildOrderPayload(extra: Record<string, unknown>) {
    return {
      user_id: session?.user?.id ?? null,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      pickup_time: params.pickupTime || null,
      status: "new",
      items: items.map((i) => ({
        lineKey: i.lineKey,
        itemId: i.itemId,
        name: i.name,
        variant: i.variant ?? null,
        selectedAddOns: i.selectedAddOns ?? [],
        lunchChoices: i.lunchChoices ?? [],
        lunchSauces: i.lunchSauces ?? [],
        specialInstructions: i.specialInstructions ?? null,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: Math.round(discountedSubtotal * 100) / 100,
      reward_label: params.rewardLabel || null,
      reward_discount: rewardDiscountCents > 0 ? discountAmount : null,
      reward_points_cost: Number(params.rewardPoints ?? 0),
      ...extra,
    };
  }

  /* ── Deduct reward points after successful order ──────── */
  async function deductRewardIfSelected() {
    if (!params.rewardId || !Number(params.rewardPoints ?? 0)) return;
    await supabase.rpc("redeem_reward", {
      p_reward_cost: Number(params.rewardPoints),
      p_reward_label: params.rewardLabel ?? "",
    });
  }

  /* ── Pay with Stripe ──────────────────────────────────── */
  async function handlePayNow() {
    setLoading(true);
    try {
      const { data: accepting } = await supabase.rpc("is_accepting_orders");
      if (!accepting) {
        Alert.alert("Orders Paused", "The restaurant is not currently accepting orders. Please call us at 580-564-9599.");
        setLoading(false);
        return;
      }

      // 1. Get client secret from Edge Function (uses discounted subtotal)
      const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
          "Authorization": `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          subtotalCents: discountedSubtotalCents,
          totalCents,
          customerName: params.customerName,
          customerPhone: params.customerPhone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.clientSecret) {
        throw new Error(json.error ?? json.msg ?? `HTTP ${res.status}: Could not reach payment server`);
      }
      const { clientSecret, paymentIntentId } = json as {
        clientSecret: string;
        paymentIntentId: string;
      };

      // 2. Initialize the Stripe payment sheet.
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Gecko's at Lake Texoma",
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { name: params.customerName },
        style: "alwaysDark",
      });
      if (initError) throw new Error(`Sheet init failed: ${initError.message}`);

      // 3. Present sheet to the user
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code === "Canceled") { setLoading(false); return; }
        throw new Error(payError.message);
      }

      // 4. Payment succeeded — insert order
      const { error: insertError } = await supabase.from("orders").insert(
        buildOrderPayload({
          payment_method: "stripe",
          payment_status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          platform_fee_cents: Math.round(discountedSubtotalCents * 0.03),
        })
      );
      if (insertError) throw insertError;

      await deductRewardIfSelected();
      clearCart();
      router.replace("/(tabs)/order");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      Alert.alert("Payment Failed", `${msg}\n\nYou can also pay when you pick up.`);
    } finally {
      setLoading(false);
    }
  }

  /* ── UI ───────────────────────────────────────────────── */
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Checkout",
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTintColor: GeckosColors.text,
          headerTitleStyle: { fontWeight: "900" },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <GeckosText style={styles.summaryNote}>
            {items.reduce((n, i) => n + i.quantity, 0)} item
            {items.reduce((n, i) => n + i.quantity, 0) !== 1 ? "s" : ""} for{" "}
            {params.customerName}
          </GeckosText>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <GeckosText style={styles.summaryRowLabel}>Subtotal</GeckosText>
            <GeckosText style={styles.summaryRowValue}>${subtotal.toFixed(2)}</GeckosText>
          </View>
          {rewardDiscountCents > 0 && (
            <View style={styles.summaryRow}>
              <GeckosText style={[styles.summaryRowLabel, styles.discountLabel]}>
                {params.rewardLabel}
              </GeckosText>
              <GeckosText style={styles.discountValue}>-${discountAmount.toFixed(2)}</GeckosText>
            </View>
          )}
          <View style={styles.summaryRow}>
            <GeckosText style={styles.summaryRowLabel}>Processing fee</GeckosText>
            <GeckosText style={styles.summaryRowValue}>${processingFee.toFixed(2)}</GeckosText>
          </View>
          <View style={styles.summaryRow}>
            <GeckosText style={styles.summaryRowLabel}>Service fee</GeckosText>
            <GeckosText style={styles.summaryRowValue}>${serviceFee.toFixed(2)}</GeckosText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <GeckosText style={styles.summaryTotalLabel}>Total</GeckosText>
            <GeckosText style={styles.summaryTotalValue}>${total.toFixed(2)}</GeckosText>
          </View>
        </View>

        {/* Pay Now */}
        <Pressable
          onPress={handlePayNow}
          disabled={loading}
          style={({ pressed }) => [
            styles.btn,
            styles.btnGreen,
            pressed && styles.btnPressed,
            loading && styles.btnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="card-outline" size={21} color="#fff" />
              <GeckosText style={styles.btnGreenText}>
                Pay Now — ${total.toFixed(2)}
              </GeckosText>
            </>
          )}
        </Pressable>

        <GeckosText style={styles.subtext}>
          Debit · Credit · Apple Pay · Google Pay · Secure via Stripe
        </GeckosText>
      </ScrollView>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
  content: {
    padding: 24,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginBottom: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: GeckosColors.border,
    alignSelf: "stretch",
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingHorizontal: 4,
  },
  summaryRowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.text,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 4,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 999,
  },
  btnGreen: {
    backgroundColor: GeckosColors.geckoGreen,
    shadowColor: GeckosColors.geckoGreen,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  btnGreenText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },
  discountLabel: {
    color: GeckosColors.geckoGreen,
    fontStyle: "italic",
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.geckoGreen,
  },
  btnPressed: { opacity: 0.88 },
  btnDisabled: { opacity: 0.5 },
  subtext: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    marginTop: -6,
  },
});
