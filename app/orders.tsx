// app/orders.tsx — Order history for logged-in customers
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

type OrderItem = {
  name?: string;
  quantity?: number;
  variant?: string | null;
};

type PastOrder = {
  id: string;
  created_at: string;
  status: string | null;
  subtotal: number | null;
  pickup_time: string | null;
  payment_method: string | null;
  items: OrderItem[] | null;
};

function getStatusLabel(status: string | null) {
  if (status === "accepted") return "Accepted";
  if (status === "preparing") return "Preparing";
  if (status === "ready") return "Ready for Pickup";
  if (status === "picked_up") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Received";
}

function getStatusColor(status: string | null) {
  if (status === "picked_up") return GeckosColors.geckoGreen;
  if (status === "cancelled") return GeckosColors.chiliRed;
  if (status === "ready") return GeckosColors.geckoGreen;
  if (status === "preparing" || status === "accepted") return "#F59E0B";
  return GeckosColors.mutedText;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function OrderCard({ order }: { order: PastOrder }) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = (order.items ?? []).reduce((n, i) => n + (i.quantity ?? 1), 0);
  const statusColor = getStatusColor(order.status);

  return (
    <Pressable
      onPress={() => setExpanded((e) => !e)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <GeckosText style={styles.cardDate}>{formatDate(order.created_at)}</GeckosText>
          <GeckosText style={styles.cardMeta}>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
            {order.pickup_time ? ` · Pickup: ${order.pickup_time}` : ""}
          </GeckosText>
        </View>
        <View style={styles.cardHeaderRight}>
          <GeckosText style={[styles.statusBadge, { color: statusColor }]}>
            {getStatusLabel(order.status)}
          </GeckosText>
          {order.subtotal != null && (
            <GeckosText style={styles.cardTotal}>${Number(order.subtotal).toFixed(2)}</GeckosText>
          )}
        </View>
      </View>

      {expanded && (
        <View style={styles.cardItems}>
          <View style={styles.cardDivider} />
          {(order.items ?? []).map((item, idx) => (
            <GeckosText key={idx} style={styles.itemLine}>
              {item.quantity ?? 1}× {item.name ?? "Item"}
              {item.variant ? ` (${item.variant})` : ""}
            </GeckosText>
          ))}
          {order.payment_method && (
            <GeckosText style={styles.paymentMethod}>
              Paid: {order.payment_method === "stripe" ? "Card" : "At Gecko's"}
            </GeckosText>
          )}
        </View>
      )}

      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={16}
        color={GeckosColors.mutedText}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export default function OrderHistoryScreen() {
  const { isLoggedIn, session } = useAuth();
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from("orders")
      .select("id, created_at, status, subtotal, pickup_time, payment_method, items")
      .eq("user_id", session?.user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchErr) {
      setError("Could not load orders. Please try again.");
    } else {
      setOrders((data ?? []) as PastOrder[]);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders, isLoggedIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Order History",
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTintColor: GeckosColors.text,
          headerTitleStyle: { fontWeight: "900" },
          headerShadowVisible: false,
        }}
      />
      <AppContainer>
        {!isLoggedIn ? (
          <View style={styles.center}>
            <Ionicons name="lock-closed-outline" size={32} color={GeckosColors.mutedText} />
            <GeckosText style={styles.emptyText}>Sign in to view your order history.</GeckosText>
            <Pressable
              onPress={() => router.push("/auth" as any)}
              style={({ pressed }) => [styles.signInBtn, pressed && styles.pressed]}
            >
              <GeckosText style={styles.signInBtnText}>Sign In</GeckosText>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={GeckosColors.geckoGreen} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={28} color={GeckosColors.chiliRed} />
            <GeckosText style={styles.emptyText}>{error}</GeckosText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GeckosColors.geckoGreen} />
            }
            showsVerticalScrollIndicator={false}
          >
            <GeckosText style={styles.screenTitle}>Order History</GeckosText>
            {orders.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="receipt-outline" size={40} color={GeckosColors.mutedText} />
                <GeckosText style={styles.emptyText}>No orders yet.</GeckosText>
                <Pressable
                  onPress={() => router.push("/(tabs)/menu" as any)}
                  style={({ pressed }) => [styles.signInBtn, pressed && styles.pressed]}
                >
                  <GeckosText style={styles.signInBtnText}>Browse Menu</GeckosText>
                </Pressable>
              </View>
            ) : (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </ScrollView>
        )}
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 40,
    gap: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
  },
  card: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 16,
  },
  cardPressed: { opacity: 0.88 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 3,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.text,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "900",
  },
  cardTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: GeckosColors.border,
    marginVertical: 10,
  },
  cardItems: {
    marginTop: 4,
  },
  itemLine: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.text,
    lineHeight: 20,
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 6,
  },
  chevron: {
    alignSelf: "center",
    marginTop: 8,
  },
  signInBtn: {
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  pressed: { opacity: 0.85 },
});
