import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { router } from "expo-router";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { supabase } from "@/src/lib/supabase";
import { GeckosColors } from "@/src/theme/colors";

const REFUND_EDGE_URL =
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/refund-payment`;

type OrderStatus = "new" | "accepted" | "preparing" | "ready" | "picked_up" | "cancelled";

type KitchenOrderItem = {
  name?: string;
  quantity?: number;
  variant?: string | null;
  selectedAddOns?: { name?: string; price?: number }[];
  lunchChoices?: string[];
  lunchSauce?: string | null;
  specialInstructions?: string | null;
};

type KitchenOrder = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_time: string | null;
  subtotal: number | null;
  status: OrderStatus | null;
  created_at: string | null;
  items: KitchenOrderItem[] | null;
  reward_label: string | null;
  reward_discount: number | null;
  reward_points_cost: number | null;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  user_id: string | null;
};

type KitchenDay = {
  id: string;
  label: string;
  opened_at: string;
  closed_at: string | null;
};

type OrderView = "active" | "all";

const ACTIVE_STATUSES: OrderStatus[] = ["new", "accepted", "preparing", "ready"];
const COMPLETED_STATUSES: OrderStatus[] = ["picked_up", "cancelled"];

function formatPhone(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value ?? "No phone";
}

function formatOrderTime(iso: string | null) {
  if (!iso) return "Unknown time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown time";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatOrderDate(iso: string | null) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function toTimeMs(iso: string | null) {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getTime();
}

function isWithinDayRange(orderCreatedAt: string | null, day: KitchenDay | null) {
  if (!day) return true;
  const orderTime = toTimeMs(orderCreatedAt);
  if (!orderTime) return false;
  const openTime = toTimeMs(day.opened_at);
  const closeTime = day.closed_at ? toTimeMs(day.closed_at) : Number.POSITIVE_INFINITY;
  return orderTime >= openTime && orderTime < closeTime;
}

function getStatusLabel(status: OrderStatus | null) {
  if (status === "accepted") return "Accepted";
  if (status === "preparing") return "Preparing";
  if (status === "ready") return "Ready";
  if (status === "picked_up") return "Picked Up";
  if (status === "cancelled") return "Cancelled";
  return "New";
}

function getStatusColor(status: OrderStatus | null) {
  if (status === "accepted") return "#3B82F6";
  if (status === "preparing") return "#F59E0B";
  if (status === "ready") return GeckosColors.geckoGreen;
  if (status === "picked_up") return "#94A3B8";
  if (status === "cancelled") return GeckosColors.chiliRed;
  return "#EF4444";
}

const FORWARD_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

const UNDO_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "new",
  preparing: "accepted",
  ready: "preparing",
  picked_up: "ready",
  cancelled: "new",
};

function getForwardLabel(nextStatus: OrderStatus | null) {
  if (nextStatus === "accepted") return "Accept";
  if (nextStatus === "preparing") return "Start";
  if (nextStatus === "ready") return "Ready";
  if (nextStatus === "picked_up") return "Picked Up";
  return null;
}

function StaffLogin({
  onSignedIn,
}: {
  onSignedIn: (session: Session) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Info", "Enter staff email and password.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error || !data.session) {
      Alert.alert("Sign In Failed", error?.message ?? "Invalid credentials.");
      return;
    }

    onSignedIn(data.session);
  }, [email, onSignedIn, password]);

  return (
    <View style={styles.authWrap}>
      <GeckosText style={styles.authTitle}>Staff Sign In</GeckosText>
      <GeckosText style={styles.authBody}>
        Use a kitchen staff account to access live orders.
      </GeckosText>

      <GeckosText style={styles.inputLabel}>Email</GeckosText>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="staff@yourrestaurant.com"
        placeholderTextColor={GeckosColors.mutedText}
      />

      <GeckosText style={styles.inputLabel}>Password</GeckosText>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={GeckosColors.mutedText}
      />

      <Pressable
        onPress={handleSignIn}
        disabled={submitting}
        style={({ pressed }) => [
          styles.signInButton,
          pressed ? styles.buttonPressed : null,
          submitting ? styles.buttonDisabled : null,
        ]}
      >
        <GeckosText style={styles.signInButtonText}>
          {submitting ? "Signing In..." : "Sign In"}
        </GeckosText>
      </Pressable>
    </View>
  );
}

function Unauthorized({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <View style={styles.centerState}>
      <Ionicons name="lock-closed-outline" size={30} color={GeckosColors.chiliRed} />
      <GeckosText style={styles.stateText}>
        This account is not marked as kitchen staff.
      </GeckosText>
      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOutButton, pressed ? styles.buttonPressed : null]}>
        <GeckosText style={styles.signOutButtonText}>Sign Out</GeckosText>
      </Pressable>
    </View>
  );
}

function OrderCard({
  order,
  onUpdateStatus,
  onCancel,
  busy,
}: {
  order: KitchenOrder;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  onCancel: (order: KitchenOrder) => Promise<void>;
  busy: boolean;
}) {
  const currentStatus = (order.status ?? "new") as OrderStatus;
  const nextStatus = FORWARD_TRANSITIONS[currentStatus] ?? null;
  const undoStatus = UNDO_TRANSITIONS[currentStatus] ?? null;
  const forwardLabel = getForwardLabel(nextStatus);
  const statusLabel = getStatusLabel(order.status);
  const statusColor = getStatusColor(order.status);
  const subtotal = Number(order.subtotal ?? 0).toFixed(2);
  const pickupDisplay = order.pickup_time?.trim() || "ASAP";
  const isStripePaid = order.payment_method === "stripe";

  const handlePressStatus = useCallback(
    (targetStatus: OrderStatus) => {
      if (targetStatus === "cancelled") {
        const cancelMsg = isStripePaid
          ? "This order was paid via Stripe. A full refund will be issued automatically."
          : "This marks the ticket as cancelled. You can undo it.";

        if (Platform.OS === "web") {
          const confirmed = typeof globalThis.confirm === "function"
            ? globalThis.confirm(`Cancel this order? ${cancelMsg}`)
            : true;
          if (!confirmed) return;
          void onCancel(order);
          return;
        }

        Alert.alert("Cancel Order?", cancelMsg, [
          { text: "Keep", style: "cancel" },
          {
            text: isStripePaid ? "Cancel & Refund" : "Cancel Order",
            style: "destructive",
            onPress: () => { void onCancel(order); },
          },
        ]);
        return;
      }

      void onUpdateStatus(order.id, targetStatus);
    },
    [isStripePaid, onCancel, onUpdateStatus, order]
  );

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <GeckosText style={styles.customerName}>
            {order.customer_name?.trim() || "Unnamed customer"}
          </GeckosText>
          <GeckosText style={styles.customerPhone}>
            {formatPhone(order.customer_phone)}
          </GeckosText>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}> 
          <GeckosText style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusLabel}
          </GeckosText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={GeckosColors.mutedText} />
        <GeckosText style={styles.metaText}>
          {formatOrderDate(order.created_at)} {formatOrderTime(order.created_at)}
        </GeckosText>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.pickupPill}>
          <Ionicons name="alarm-outline" size={17} color={GeckosColors.background} />
          <GeckosText style={styles.pickupPillLabel}>Pickup</GeckosText>
          <GeckosText style={styles.pickupPillValue}>{pickupDisplay}</GeckosText>
        </View>
      </View>

      <GeckosText style={styles.sectionLabel}>Cook This</GeckosText>
      <View style={styles.itemsWrap}>
        {(order.items ?? []).map((item, idx) => (
          <View key={`${item.name ?? "item"}-${idx}`} style={styles.itemRow}>
            <GeckosText style={styles.itemQty}>{item.quantity ?? 1}x</GeckosText>
            <View style={styles.itemBody}>
              <GeckosText style={styles.itemName}>{item.name ?? "Menu item"}</GeckosText>
              {item.variant ? <GeckosText style={styles.itemDetail}>{item.variant}</GeckosText> : null}
              {(item.selectedAddOns ?? []).map((addOn, addOnIdx) => (
                <GeckosText key={`${addOn.name ?? "addon"}-${addOnIdx}`} style={styles.itemDetail}>
                  + {addOn.name ?? "Add-on"}
                </GeckosText>
              ))}
              {(item.lunchChoices ?? []).length > 0 ? (
                <GeckosText style={styles.itemDetail}>
                  Lunch choices: {(item.lunchChoices ?? []).join(", ")}
                </GeckosText>
              ) : null}
              {item.lunchSauce ? <GeckosText style={styles.itemDetail}>Sauce: {item.lunchSauce}</GeckosText> : null}
              {item.specialInstructions ? (
                <GeckosText style={styles.itemDetail}>Note: {item.specialInstructions}</GeckosText>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {order.reward_label ? (
        <View style={styles.rewardBadge}>
          <Ionicons name="star" size={14} color={GeckosColors.geckoGreen} />
          <GeckosText style={styles.rewardBadgeText}>
            Reward: {order.reward_label}
            {order.reward_discount ? ` (-$${Number(order.reward_discount).toFixed(2)})` : ""}
          </GeckosText>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <GeckosText style={styles.subtotalText}>Subtotal: ${subtotal}</GeckosText>

        <View style={styles.actionRow}>
          {undoStatus ? (
            <Pressable
              onPress={() => handlePressStatus(undoStatus)}
              disabled={busy}
              style={({ pressed }) => [
                styles.actionButton,
                styles.undoButton,
                pressed ? styles.buttonPressed : null,
                busy ? styles.buttonDisabled : null,
              ]}
            >
              <GeckosText style={styles.undoButtonText}>Undo</GeckosText>
            </Pressable>
          ) : null}

          {forwardLabel && nextStatus ? (
            <Pressable
              onPress={() => handlePressStatus(nextStatus)}
              disabled={busy}
              style={({ pressed }) => [
                styles.actionButton,
                pressed ? styles.buttonPressed : null,
                busy ? styles.buttonDisabled : null,
              ]}
            >
              <GeckosText style={styles.actionButtonText}>{forwardLabel}</GeckosText>
            </Pressable>
          ) : null}

          {currentStatus !== "cancelled" && currentStatus !== "picked_up" ? (
            <Pressable
              onPress={() => handlePressStatus("cancelled")}
              disabled={busy}
              style={({ pressed }) => [
                styles.actionButton,
                styles.cancelButton,
                pressed ? styles.buttonPressed : null,
                busy ? styles.buttonDisabled : null,
              ]}
            >
              <GeckosText style={styles.actionButtonText}>Cancel</GeckosText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function KitchenScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [days, setDays] = useState<KitchenDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderView, setOrderView] = useState<OrderView>("active");
  const [showHistory, setShowHistory] = useState(false);
  const [historyDayId, setHistoryDayId] = useState<string | null>(null);
  const [dayActionBusy, setDayActionBusy] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const checkStaffAccess = useCallback(async (currentSession: Session | null) => {
    setAuthError(null);

    if (!currentSession?.user?.id) {
      setIsStaff(false);
      setAuthReady(true);
      return;
    }

    const { data, error } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    if (error) {
      setAuthError("Could not verify staff access. Check staff_users table and policies.");
      setIsStaff(false);
      setAuthReady(true);
      return;
    }

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

  const fetchOrders = useCallback(async () => {
    setErrorMessage(null);
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, pickup_time, subtotal, status, created_at, items, reward_label, reward_discount, reward_points_cost, payment_method, stripe_payment_intent_id, user_id")
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      setErrorMessage("Could not load orders. Confirm staff RLS policies on orders.");
      return;
    }

    setOrders((data ?? []) as KitchenOrder[]);
  }, []);

  const fetchDays = useCallback(async () => {
    const { data, error } = await supabase
      .from("kitchen_days")
      .select("id, label, opened_at, closed_at")
      .order("opened_at", { ascending: false })
      .limit(120);

    if (error) {
      setErrorMessage("Could not load day sessions. Confirm kitchen_days table and policies.");
      return;
    }

    const dayRows = (data ?? []) as KitchenDay[];
    setDays(dayRows);
  }, []);

  const runRetentionSweep = useCallback(async () => {
    const { error } = await supabase.rpc("archive_and_purge_orders", {
      archive_after_hours: 36,
      purge_after_days: 7,
    });
    if (!error) return;
  }, []);

  const loadInitial = useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    await runRetentionSweep();
    await Promise.all([fetchOrders(), fetchDays()]);
    setLoading(false);
  }, [fetchDays, fetchOrders, isStaff, runRetentionSweep]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!isStaff) return;

    const orderChannel = supabase
      .channel("kitchen-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void fetchOrders();
        }
      )
      .subscribe();

    const dayChannel = supabase
      .channel("kitchen-days-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_days" },
        () => {
          void fetchDays();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(dayChannel);
    };
  }, [fetchDays, fetchOrders, isStaff]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runRetentionSweep();
    await Promise.all([fetchOrders(), fetchDays()]);
    setRefreshing(false);
  }, [fetchDays, fetchOrders, runRetentionSweep]);

  const openDay = useMemo(() => days.find((day) => !day.closed_at) ?? null, [days]);
  const closedDays = useMemo(() => days.filter((day) => !!day.closed_at), [days]);
  const selectedHistoryDay = useMemo(
    () => closedDays.find((day) => day.id === historyDayId) ?? null,
    [closedDays, historyDayId]
  );
  const selectedDay = showHistory ? selectedHistoryDay : openDay;
  const openDayActiveCount = useMemo(() => {
    if (!openDay) return 0;
    return orders.filter((order) => {
      if (!isWithinDayRange(order.created_at, openDay)) return false;
      const status = (order.status ?? "new") as OrderStatus;
      return ACTIVE_STATUSES.includes(status);
    }).length;
  }, [openDay, orders]);

  const visibleOrders = useMemo(() => {
    if (!selectedDay) return [];
    let source = orders.filter((order) => isWithinDayRange(order.created_at, selectedDay));
    if (orderView === "active") {
      source = source.filter((order) => ACTIVE_STATUSES.includes((order.status ?? "new") as OrderStatus));
    }

    return source.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
  }, [orderView, orders, selectedDay]);

  const counts = useMemo(() => {
    if (!selectedDay) return { active: 0, completed: 0, total: 0 };
    const countSource = orders.filter((order) => isWithinDayRange(order.created_at, selectedDay));

    let active = 0;
    let completed = 0;
    for (const order of countSource) {
      const status = (order.status ?? "new") as OrderStatus;
      if (ACTIVE_STATUSES.includes(status)) active += 1;
      if (COMPLETED_STATUSES.includes(status)) completed += 1;
    }
    return { active, completed, total: countSource.length };
  }, [orders, selectedDay]);

  const handleOpenDay = useCallback(async () => {
    if (openDay) return;

    setDayActionBusy(true);
    const dayLabel = new Date().toLocaleDateString([], { month: "short", day: "numeric" });

    const { data, error } = await supabase
      .from("kitchen_days")
      .insert({ label: dayLabel })
      .select("id, label, opened_at, closed_at")
      .single();

    setDayActionBusy(false);

    if (error) {
      Alert.alert("Open Day Failed", error.message);
      return;
    }

    setDays((prev) => [data as KitchenDay, ...prev]);
    await fetchDays();
  }, [fetchDays, openDay]);

  const handleCloseCurrentDay = useCallback(async () => {
    if (!openDay) {
      Alert.alert("No Open Day", "There is no open day to close.");
      return;
    }

    const warningText = openDayActiveCount > 0
      ? `Warning: ${openDayActiveCount} active order(s) still open. Close anyway? New incoming orders will not appear until a new day is opened.`
      : "Close this day now? New incoming orders will not appear until a new day is opened.";

    const performClose = async () => {
      setDayActionBusy(true);
      const { error } = await supabase
        .from("kitchen_days")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", openDay.id);
      setDayActionBusy(false);

      if (error) {
        Alert.alert("Close Day Failed", error.message);
        return;
      }

      await fetchDays();
    };

    if (Platform.OS === "web") {
      const confirmed = typeof globalThis.confirm === "function"
        ? globalThis.confirm(warningText)
        : true;
      if (!confirmed) return;
      await performClose();
      return;
    }

    Alert.alert(
      "Close Day?",
      warningText,
      [
        { text: "Keep Open", style: "cancel" },
        { text: "Close Day", style: "destructive", onPress: () => { void performClose(); } },
      ]
    );
  }, [fetchDays, openDay, openDayActiveCount]);

  const handleToggleHistory = useCallback(() => {
    if (!showHistory) {
      setShowHistory(true);
      setOrderView("all");
      if (!historyDayId) {
        const latestClosed = closedDays[0]?.id ?? null;
        setHistoryDayId(latestClosed);
      }
      return;
    }

    setShowHistory(false);
    setOrderView("active");
  }, [closedDays, historyDayId, showHistory]);

  const handleDeleteDay = useCallback(async (day: KitchenDay) => {
    const performDelete = async () => {
      const { error } = await supabase
        .from("kitchen_days")
        .delete()
        .eq("id", day.id);
      if (error) {
        Alert.alert("Delete Failed", error.message);
        return;
      }
      setDays((prev) => prev.filter((d) => d.id !== day.id));
      if (historyDayId === day.id) setHistoryDayId(null);
    };

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`Delete "${day.label}"?`)) await performDelete();
      return;
    }

    Alert.alert("Delete Day?", `Remove "${day.label}" from history?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void performDelete(); } },
    ]);
  }, [historyDayId]);

  const handleUpdateStatus = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);

    const patch: Record<string, string | null> = { status: nextStatus };
    if (nextStatus === "new") {
      patch.accepted_at = null;
      patch.ready_at = null;
    }
    if (nextStatus === "accepted") {
      patch.accepted_at = new Date().toISOString();
      patch.ready_at = null;
    }
    if (nextStatus === "preparing") {
      patch.ready_at = null;
    }
    if (nextStatus === "ready") {
      patch.ready_at = new Date().toISOString();
    }

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    setUpdatingOrderId(null);

    if (error) {
      Alert.alert("Update Failed", `Could not update order status. ${error.message}`);
      return;
    }

    await fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = useCallback(async (order: KitchenOrder) => {
    setUpdatingOrderId(order.id);
    try {
      if (order.payment_method === "stripe" && order.stripe_payment_intent_id) {
        const res = await fetch(REFUND_EDGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: order.stripe_payment_intent_id }),
        });
        const json = await res.json();
        if (!res.ok) {
          Alert.alert(
            "Refund Failed",
            json?.error ?? "Could not issue Stripe refund. Please refund manually in the Stripe dashboard.",
          );
          setUpdatingOrderId(null);
          return;
        }
      }
      if ((order.reward_points_cost ?? 0) > 0 && order.user_id) {
        await supabase.rpc("restore_reward_points", {
          p_user_id: order.user_id,
          p_points: order.reward_points_cost,
          p_label: order.reward_label ?? "reward",
        });
      }
      await handleUpdateStatus(order.id, "cancelled");
    } catch {
      Alert.alert("Cancel Failed", "Something went wrong. Please try again.");
      setUpdatingOrderId(null);
    }
  }, [handleUpdateStatus]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setOrders([]);
    setIsStaff(false);
  }, []);

  const onSignedIn = useCallback((nextSession: Session) => {
    setSession(nextSession);
    setAuthReady(false);
    checkStaffAccess(nextSession);
  }, [checkStaffAccess]);

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
              <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signOutButton, pressed ? styles.buttonPressed : null]}>
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

  return (
    <>
      <StatusBar style="light" />
      <AppContainer>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <GeckosText style={styles.title}>Kitchen Dashboard</GeckosText>
            <GeckosText style={styles.subtitle}>
              {showHistory
                ? (selectedHistoryDay ? `${selectedHistoryDay.label} (History)` : "History")
                : (openDay ? `${openDay.label} (Open)` : "No open day")}
            </GeckosText>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/menu-content" as any)} style={({ pressed }) => [styles.signOutButton, pressed ? styles.buttonPressed : null]}>
              <GeckosText style={styles.signOutButtonText}>Menu</GeckosText>
            </Pressable>
            <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.signOutButton, pressed ? styles.buttonPressed : null]}>
              <GeckosText style={styles.signOutButtonText}>Sign Out</GeckosText>
            </Pressable>
            <Pressable
              onPress={handleToggleHistory}
              style={({ pressed }) => [
                styles.signOutButton,
                showHistory ? styles.historyButtonActive : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <GeckosText style={[styles.signOutButtonText, showHistory ? styles.historyButtonTextActive : null]}>
                {showHistory ? "Live" : "History"}
              </GeckosText>
            </Pressable>
          </View>
        </View>

        <View style={styles.daySessionBar}>
          <View style={styles.daySessionCenter}>
            <View style={styles.daySessionLabelRow}>
              <GeckosText style={styles.daySessionText}>
                {showHistory
                  ? (selectedHistoryDay?.label ?? "No previous day found")
                  : (openDay ? openDay.label : "No Day Open")}
              </GeckosText>
              {showHistory && selectedHistoryDay ? (
                <Pressable
                  onPress={() => handleDeleteDay(selectedHistoryDay)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteDayBtn, pressed && styles.buttonPressed]}
                >
                  <Ionicons name="trash-outline" size={15} color={GeckosColors.chiliRed} />
                  <GeckosText style={styles.deleteDayBtnText}>Delete Day</GeckosText>
                </Pressable>
              ) : null}
            </View>
            {showHistory ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyDaysRow}
              >
                {closedDays.map((day) => {
                  const selected = day.id === selectedHistoryDay?.id;
                  return (
                    <View
                      key={day.id}
                      style={[
                        styles.historyDayChip,
                        selected ? styles.historyDayChipActive : null,
                      ]}
                    >
                      <Pressable
                        onPress={() => setHistoryDayId(day.id)}
                        style={({ pressed }) => pressed ? styles.buttonPressed : null}
                      >
                        <GeckosText style={[styles.historyDayChipText, selected ? styles.historyDayChipTextActive : null]}>
                          {day.label}
                        </GeckosText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteDay(day)}
                        hitSlop={6}
                        style={({ pressed }) => pressed ? styles.buttonPressed : null}
                      >
                        <Ionicons name="close" size={13} color={selected ? GeckosColors.geckoGreen : GeckosColors.mutedText} />
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.daySessionActions}>
                {!openDay ? (
                  <Pressable
                    onPress={handleOpenDay}
                    disabled={dayActionBusy}
                    style={({ pressed }) => [
                      styles.dayActionButton,
                      pressed ? styles.buttonPressed : null,
                      dayActionBusy ? styles.buttonDisabled : null,
                    ]}
                  >
                    <GeckosText style={styles.dayActionButtonText}>Open Day</GeckosText>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={handleCloseCurrentDay}
                  disabled={dayActionBusy || !openDay}
                  style={({ pressed }) => [
                    styles.closeDayButton,
                    pressed ? styles.buttonPressed : null,
                    (dayActionBusy || !openDay) ? styles.buttonDisabled : null,
                  ]}
                >
                  <GeckosText style={styles.closeDayButtonText}>Close Day</GeckosText>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Pressable
            onPress={() => setOrderView("active")}
            style={({ pressed }) => [
              styles.metricCard,
              orderView === "active" ? styles.metricCardActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <GeckosText style={styles.metricLabel}>Active</GeckosText>
            <GeckosText style={styles.metricValue}>{counts.active}</GeckosText>
          </Pressable>
          <Pressable
            onPress={() => setOrderView("all")}
            style={({ pressed }) => [
              styles.dailyTotalPill,
              orderView === "all" ? styles.dailyTotalPillActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <GeckosText style={styles.dailyTotalLabel}>Daily Total</GeckosText>
            <GeckosText style={styles.dailyTotalValue}>{counts.total}</GeckosText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={GeckosColors.geckoGreen} />
            <GeckosText style={styles.stateText}>Loading orders...</GeckosText>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={28} color={GeckosColors.chiliRed} />
            <GeckosText style={styles.stateText}>{errorMessage}</GeckosText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GeckosColors.geckoGreen} />
            }
          >
            {visibleOrders.length === 0 ? (
              <View style={styles.centerState}>
                <Ionicons name="checkmark-circle-outline" size={30} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.stateText}>No orders in this view.</GeckosText>
              </View>
            ) : (
              visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onCancel={handleCancelOrder}
                  busy={updatingOrderId === order.id}
                />
              ))
            )}
          </ScrollView>
        )}
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  daySessionBar: {
    alignItems: "center",
    gap: 10,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  daySessionCenter: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
  },
  daySessionActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  daySessionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  deleteDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GeckosColors.chiliRed,
  },
  deleteDayBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: GeckosColors.chiliRed,
  },
  daySessionText: {
    textAlign: "left",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.2,
    color: GeckosColors.text,
  },
  dayActionButton: {
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  dayActionButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  closeDayButton: {
    borderRadius: 999,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDayButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  authWrap: {
    flex: 1,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  authBody: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: GeckosColors.mutedText,
  },
  inputLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  input: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.text,
  },
  signInButton: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GeckosColors.geckoGreen,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  signOutButton: {
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signOutButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  historyButtonActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  historyButtonTextActive: {
    color: GeckosColors.geckoGreen,
  },
  historyDaysRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  historyDayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  historyDayChipActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  historyDayChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  historyDayChipTextActive: {
    color: GeckosColors.geckoGreen,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metricCardActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  metricLabel: {
    fontSize: 12,
    color: GeckosColors.mutedText,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
    color: GeckosColors.text,
    marginTop: 4,
  },
  dailyTotalPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 92,
  },
  dailyTotalPillActive: {
    borderColor: GeckosColors.geckoGreen,
    backgroundColor: "#11231A",
  },
  dailyTotalLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: GeckosColors.mutedText,
  },
  dailyTotalValue: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: GeckosColors.surface,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  customerPhone: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: GeckosColors.background,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pickupPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pickupPillLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  pickupPillValue: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: GeckosColors.mutedText,
    fontWeight: "800",
  },
  itemsWrap: {
    marginTop: 0,
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    gap: 8,
  },
  itemQty: {
    width: 36,
    fontSize: 19,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  itemDetail: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 1,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rewardBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
    flex: 1,
  },
  cardFooter: {
    marginTop: 4,
    gap: 10,
  },
  subtotalText: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: GeckosColors.geckoGreen,
  },
  undoButton: {
    backgroundColor: GeckosColors.background,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  cancelButton: {
    backgroundColor: GeckosColors.chiliRed,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  stateText: {
    fontSize: 14,
    textAlign: "center",
    color: GeckosColors.mutedText,
    fontWeight: "600",
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
