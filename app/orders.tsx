import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useCart } from "@/src/context/CartContext";
import { supabase } from "@/src/lib/supabase";

type FullOrderItem = {
  lineKey?: string;
  itemId?: string;
  name?: string;
  quantity?: number;
  variant?: string | null;
  selectedAddOns?: { name: string; price: number }[];
  lunchChoices?: string[];
  lunchSauces?: string[];
  specialInstructions?: string | null;
  price?: number;
};

type PastOrder = {
  id: string;
  created_at: string;
  status: string | null;
  subtotal: number | null;
  pickup_time: string | null;
  payment_method: string | null;
  items: FullOrderItem[] | null;
};

const ACTIVE_STATUSES = ["new", "accepted", "preparing", "ready"];

const STATUS_STEPS = [
  { key: "new",       label: "Order Received",   icon: "receipt-outline" as const },
  { key: "accepted",  label: "Accepted",          icon: "checkmark-circle-outline" as const },
  { key: "preparing", label: "Preparing",         icon: "flame-outline" as const },
  { key: "ready",     label: "Ready for Pickup",  icon: "bag-check-outline" as const },
  { key: "picked_up", label: "Picked Up",         icon: "checkmark-done-outline" as const },
];

function getStatusLabel(status: string | null) {
  if (status === "accepted")  return "Accepted";
  if (status === "preparing") return "Preparing";
  if (status === "ready")     return "Ready for Pickup";
  if (status === "picked_up") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Received";
}

function getStatusColor(status: string | null) {
  if (status === "picked_up") return GeckosColors.geckoGreen;
  if (status === "cancelled") return GeckosColors.chiliRed;
  if (status === "ready")     return GeckosColors.geckoGreen;
  if (status === "preparing" || status === "accepted") return "#F59E0B";
  return GeckosColors.mutedText;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ── Active order live tracker ──────────────────────────────────────────────────
function ActiveOrderCard({ order, onStatusChange }: { order: PastOrder; onStatusChange: (id: string, status: string) => void }) {
  const [liveStatus, setLiveStatus] = useState(order.status ?? "new");

  useEffect(() => {
    setLiveStatus(order.status ?? "new");
    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          const next = payload.new?.status as string;
          if (next) {
            setLiveStatus(next);
            onStatusChange(order.id, next);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id, order.status, onStatusChange]);

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === liveStatus);
  const isCancelled = liveStatus === "cancelled";

  if (isCancelled) return null;

  return (
    <View style={styles.activeCard}>
      <View style={styles.activeCardHeader}>
        <View style={styles.pulseDot} />
        <GeckosText style={styles.activeCardTitle}>Order In Progress</GeckosText>
        <GeckosText style={[styles.activeStatusBadge, { color: getStatusColor(liveStatus) }]}>
          {getStatusLabel(liveStatus)}
        </GeckosText>
      </View>
      <GeckosText style={styles.activeCardMeta}>
        {formatDate(order.created_at)}
        {order.subtotal != null ? `  ·  $${Number(order.subtotal).toFixed(2)}` : ""}
      </GeckosText>

      <View style={styles.miniTimeline}>
        {STATUS_STEPS.map((step, idx) => {
          const done   = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <View key={step.key} style={styles.miniStep}>
              {idx > 0 && (
                <View style={[styles.miniLineLeft, idx <= currentIdx && styles.miniLineDone]} />
              )}
              {idx < STATUS_STEPS.length - 1 && (
                <View style={[styles.miniLineRight, idx < currentIdx && styles.miniLineDone]} />
              )}
              <View style={[styles.miniDot, done && styles.miniDotDone, active && styles.miniDotActive]}>
                <Ionicons name={step.icon} size={12} color={done ? "#fff" : GeckosColors.mutedText} />
              </View>
              <GeckosText style={[styles.miniLabel, done && styles.miniLabelDone, active && styles.miniLabelActive]}>
                {step.label}
              </GeckosText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Past order card with reorder ───────────────────────────────────────────────
function OrderCard({
  order,
  onReorder,
}: {
  order: PastOrder;
  onReorder: (order: PastOrder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = (order.items ?? []).reduce((n, i) => n + (i.quantity ?? 1), 0);
  const statusColor = getStatusColor(order.status);
  const isActive = ACTIVE_STATUSES.includes(order.status ?? "");

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => pressed && styles.cardPressed}
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
            <GeckosText style={[styles.statusBadge, { color: isActive ? "#F59E0B" : statusColor }]}>
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
                {(item.selectedAddOns ?? []).length > 0
                  ? ` + ${(item.selectedAddOns ?? []).map((a) => a.name).join(", ")}`
                  : ""}
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

      {(order.items ?? []).some((i) => i.name && (i.price ?? 0) > 0) && (
        <Pressable
          onPress={() => onReorder(order)}
          style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
        >
          <Ionicons name="refresh-outline" size={15} color={GeckosColors.geckoGreen} />
          <GeckosText style={styles.reorderBtnText}>Reorder</GeckosText>
        </Pressable>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function OrderHistoryScreen() {
  const { isLoggedIn, session } = useAuth();
  const { addItem, clearCart, items: cartItems } = useCart();
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusOverrides = useRef<Map<string, string>>(new Map());

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

  const handleStatusChange = useCallback((orderId: string, newStatus: string) => {
    statusOverrides.current.set(orderId, newStatus);
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleReorder = useCallback((order: PastOrder) => {
    const validItems = (order.items ?? []).filter((i) => i.name && (i.price ?? 0) > 0);
    if (!validItems.length) return;

    const doReorder = () => {
      clearCart();
      validItems.forEach((item, idx) => {
        addItem({
          lineKey: `reorder-${item.itemId ?? item.name}-${Date.now()}-${idx}`,
          itemId: item.itemId ?? item.name ?? "unknown",
          name: item.name!,
          variant: item.variant ?? undefined,
          selectedAddOns: item.selectedAddOns ?? [],
          lunchChoices: item.lunchChoices ?? [],
          lunchSauces: item.lunchSauces ?? [],
          specialInstructions: item.specialInstructions ?? undefined,
          price: item.price ?? 0,
          quantity: item.quantity ?? 1,
        });
      });
      router.navigate("/(tabs)/order");
    };

    if (cartItems.length > 0) {
      Alert.alert(
        "Replace Cart?",
        "Your current cart will be replaced with this order.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reorder", onPress: doReorder },
        ]
      );
    } else {
      doReorder();
    }
  }, [addItem, clearCart, cartItems.length]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status ?? ""));
  const pastOrders   = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status ?? ""));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Order History",
          headerBackTitle: "Back",
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

            {/* Active orders with live tracker */}
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <GeckosText style={styles.sectionLabel}>Active Orders</GeckosText>
                {activeOrders.map((o) => (
                  <ActiveOrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />
                ))}
              </View>
            )}

            {/* Past orders */}
            {pastOrders.length === 0 && activeOrders.length === 0 ? (
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
            ) : pastOrders.length > 0 ? (
              <View style={styles.section}>
                {activeOrders.length > 0 && (
                  <GeckosText style={styles.sectionLabel}>Past Orders</GeckosText>
                )}
                {pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onReorder={handleReorder} />
                ))}
              </View>
            ) : null}
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
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: GeckosColors.mutedText,
    marginBottom: 2,
  },

  // Active order card
  activeCard: {
    backgroundColor: "#0D1F17",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    padding: 16,
    gap: 10,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GeckosColors.geckoGreen,
  },
  activeCardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
    flex: 1,
  },
  activeStatusBadge: {
    fontSize: 12,
    fontWeight: "900",
  },
  activeCardMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },

  // Mini timeline inside active card
  miniTimeline: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  miniStep: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  miniDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1.5,
    borderColor: GeckosColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  miniDotDone: {
    backgroundColor: GeckosColors.geckoGreen,
    borderColor: GeckosColors.geckoGreen,
  },
  miniDotActive: {
    borderColor: GeckosColors.geckoGreen,
  },
  miniLineLeft: {
    position: "absolute",
    top: 11,
    left: 0,
    right: "50%",
    height: 1.5,
    backgroundColor: GeckosColors.border,
    zIndex: -1,
  },
  miniLineRight: {
    position: "absolute",
    top: 11,
    left: "50%",
    right: 0,
    height: 1.5,
    backgroundColor: GeckosColors.border,
    zIndex: -1,
  },
  miniLineDone: {
    backgroundColor: GeckosColors.geckoGreen,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 12,
  },
  miniLabelDone: {
    color: GeckosColors.text,
  },
  miniLabelActive: {
    color: GeckosColors.geckoGreen,
    fontWeight: "900",
  },

  // Past order card
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
    gap: 12,
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

  // Reorder button
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "rgba(74, 222, 128, 0.06)",
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
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
