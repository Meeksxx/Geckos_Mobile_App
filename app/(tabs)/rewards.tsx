import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

/* ─────────────────────── CONFIG ─────────────────────── */

const EVENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwCbEHB99zyAVu3LnuHK5lum6Ske0flTYmSCynDsJdNwfyEx-LV9evVS-ZVUOCj_O461BjR7yMDYPN/pub?output=csv";

const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

const MARGARITA_IMAGE = require("../../assets/more/margarita.jpg");

const HEADER_BAR_HEIGHT = 48;

/* ─────────────────────── REWARDS CONFIG ─────────────────────── */

type Reward = {
  id: string;
  points: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const REWARDS: Reward[] = [
  {
    id: "drink",
    points: 250,
    label: "Free Drink",
    icon: "cafe",
    description: "Any fountain drink or iced tea on us!",
  },
  {
    id: "five_off",
    points: 500,
    label: "$5 Off Order",
    icon: "pricetag",
    description: "Take $5 off any order.",
  },
  {
    id: "appetizer",
    points: 1000,
    label: "Free Appetizer",
    icon: "restaurant",
    description: "Any appetizer — on the house.",
  },
  {
    id: "entree",
    points: 2000,
    label: "Free Entrée",
    icon: "star",
    description: "Pick any entrée, free!",
  },
];

/* ─────────────────────── TYPES ─────────────────────── */

type EventType = "music" | "special" | "closure" | "other";

type GeckosEvent = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  details: string;
  type: EventType;
  imageUrl: string;
};

type PointsTransaction = {
  id: string;
  points: number;
  type: "earned" | "redeemed" | "expired" | "adjusted";
  description: string | null;
  created_at: string;
};

/* ─────────────────────── HELPERS ─────────────────────── */

function safeOpenUrl(url: string) {
  if (!url) return;
  if (url.startsWith("tel:") && Platform.OS === "ios" && Platform.isPad) {
    const number = url.replace("tel:", "");
    Alert.alert("Call Gecko's", number, [{ text: "OK" }]);
    return;
  }
  Linking.openURL(url).catch(() => {});
}

function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };
  const pushRow = () => {
    const isAllEmpty = currentRow.every((c) => (c ?? "").trim() === "");
    if (!isAllEmpty) rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { currentField += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) { pushField(); continue; }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      pushField(); pushRow(); continue;
    }
    currentField += char;
  }
  pushField();
  pushRow();

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => (h ?? "").trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
}

function normalizeEventType(value: string): EventType {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "music") return "music";
  if (v === "special") return "special";
  if (v === "closure") return "closure";
  return "other";
}

function formatEventDate(yyyyMmDd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((yyyyMmDd ?? "").trim());
  if (!m) return yyyyMmDd;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return yyyyMmDd;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTimeRange(start: string, end: string) {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (!s && !e) return "";
  const toPretty = (t: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!match) return t;
    const hh = Number(match[1]);
    const mm = match[2];
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${mm} ${ampm}`;
  };
  if (s && e) return `${toPretty(s)}–${toPretty(e)}`;
  if (s) return toPretty(s);
  return toPretty(e);
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const w = Math.floor(diffDays / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ─────────────────────── SHARED UI ─────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <GeckosText style={styles.sectionTitle}>{children}</GeckosText>;
}

function Card({
  children,
  noPadding,
}: {
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <View style={[styles.card, noPadding ? styles.cardNoPadding : null]}>
      {children}
    </View>
  );
}

function EventTypePill({ type }: { type: EventType }) {
  const { label, icon } = useMemo(() => {
    if (type === "music") return { label: "Live Music", icon: "musical-notes" as const };
    if (type === "special") return { label: "Special", icon: "pricetag" as const };
    if (type === "closure") return { label: "Closure", icon: "alert-circle" as const };
    return { label: "Update", icon: "information-circle" as const };
  }, [type]);

  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color={GeckosColors.text} />
      <GeckosText style={styles.pillText}>{label}</GeckosText>
    </View>
  );
}

/* ─────────────────────── REWARDS UI ─────────────────────── */

function RewardTile({
  reward,
  totalPoints,
  onRedeem,
  isRedeeming,
}: {
  reward: Reward;
  totalPoints: number;
  onRedeem: (r: Reward) => void;
  isRedeeming: boolean;
}) {
  const eligible = totalPoints >= reward.points;
  const ptsNeeded = eligible ? 0 : reward.points - totalPoints;

  return (
    <View style={[styles.rewardTile, eligible && styles.rewardTileEligible]}>
      <View style={[styles.rewardTileIconWrap, eligible && styles.rewardTileIconWrapEligible]}>
        <Ionicons
          name={reward.icon}
          size={26}
          color={eligible ? GeckosColors.geckoGreen : GeckosColors.mutedText}
        />
      </View>

      <GeckosText style={styles.rewardTilePts}>{reward.points} pts</GeckosText>
      <GeckosText style={[styles.rewardTileLabel, eligible && styles.rewardTileLabelEligible]}>
        {reward.label}
      </GeckosText>

      {eligible ? (
        <Pressable
          style={({ pressed }) => [styles.redeemBtn, pressed && styles.redeemBtnPressed]}
          onPress={() => onRedeem(reward)}
          disabled={isRedeeming}
        >
          {isRedeeming ? (
            <ActivityIndicator size="small" color={GeckosColors.background} />
          ) : (
            <GeckosText style={styles.redeemBtnText}>Use Reward</GeckosText>
          )}
        </Pressable>
      ) : (
        <GeckosText style={styles.rewardNeedText}>{ptsNeeded} more pts</GeckosText>
      )}
    </View>
  );
}

function SignInForRewards() {
  return (
    <Card>
      <View style={styles.signInRow}>
        <View style={styles.signInIconWrap}>
          <Ionicons name="star" size={32} color={GeckosColors.geckoGreen} />
        </View>
        <GeckosText style={styles.signInTitle}>Earn Gecko's Rewards</GeckosText>
        <GeckosText style={styles.signInBody}>
          Sign in to earn 10 pts for every $1 you spend. Redeem for free drinks,
          appetizers, and more.
        </GeckosText>
        <Pressable
          style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
          onPress={() => router.push("/auth" as any)}
        >
          <GeckosText style={styles.signInBtnText}>Sign In to Start Earning</GeckosText>
        </Pressable>
      </View>
    </Card>
  );
}

/* ─────────────────────── SCREEN ─────────────────────── */

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;
  const { session, isLoggedIn } = useAuth();

  /* ── Events state ── */
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<GeckosEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [badEventImages, setBadEventImages] = useState<Record<string, true>>({});

  /* ── Points state ── */
  const [totalPoints, setTotalPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  /* ── Events fetch ── */
  const fetchEvents = useCallback(async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await fetch(EVENTS_CSV_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      const records = parseCSV(csv);
      const parsed: GeckosEvent[] = records
        .map((r) => {
          const title = (r.title ?? "").trim();
          const date = (r.date ?? "").trim();
          if (!title || !date) return null;
          return {
            title,
            date,
            startTime: (r.startTime ?? "").trim(),
            endTime: (r.endTime ?? "").trim(),
            details: (r.details ?? "").trim(),
            type: normalizeEventType(r.type ?? ""),
            imageUrl: (r.imageUrl ?? "").trim(),
          } as GeckosEvent;
        })
        .filter(Boolean) as GeckosEvent[];
      parsed.sort((a, b) => a.date.localeCompare(b.date));
      setEvents(parsed);
    } catch {
      setErrorMessage("Couldn't load updates right now. Pull to refresh, or try again later.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Points fetch ── */
  const fetchPoints = useCallback(async () => {
    if (!session?.user?.id) return;
    setPointsLoading(true);
    const [pointsRes, txRes] = await Promise.all([
      supabase
        .from("customer_points")
        .select("total_points, lifetime_points")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase
        .from("points_transactions")
        .select("id, points, type, description, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    setTotalPoints(pointsRes.data?.total_points ?? 0);
    setLifetimePoints(pointsRes.data?.lifetime_points ?? 0);
    setTransactions((txRes.data as PointsTransaction[]) ?? []);
    setPointsLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchPoints()]);
    setRefreshing(false);
  }, [fetchEvents, fetchPoints]);

  /* ── Reward redemption ── */
  const handleRedeem = useCallback(
    (reward: Reward) => {
      Alert.alert(
        `Redeem: ${reward.label}`,
        `Use ${reward.points} pts for ${reward.label}? Show the confirmation to your server when ordering.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Redeem",
            onPress: async () => {
              setRedeemingId(reward.id);
              const { data, error } = await supabase.rpc("redeem_reward", {
                p_reward_cost: reward.points,
                p_reward_label: reward.label,
              });
              setRedeemingId(null);
              if (error || (data as any)?.success === false) {
                Alert.alert(
                  "Redemption Failed",
                  error?.message ?? (data as any)?.error ?? "Please try again."
                );
                return;
              }
              await fetchPoints();
              Alert.alert(
                "Reward Redeemed!",
                `Tell your server you're redeeming "${reward.label}" — they'll take care of it!`
              );
            },
          },
        ]
      );
    },
    [fetchPoints]
  );

  /* ── Progress bar logic ── */
  const nextTierReward = useMemo(
    () => REWARDS.find((r) => totalPoints < r.points),
    [totalPoints]
  );
  const { progressPct, ptsToNext } = useMemo(() => {
    if (!nextTierReward) return { progressPct: 1, ptsToNext: 0 };
    const idx = REWARDS.indexOf(nextTierReward);
    const prevMilestone = idx > 0 ? REWARDS[idx - 1].points : 0;
    const pct = (totalPoints - prevMilestone) / (nextTierReward.points - prevMilestone);
    return { progressPct: Math.max(0, Math.min(pct, 1)), ptsToNext: nextTierReward.points - totalPoints };
  }, [totalPoints, nextTierReward]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerBackground: () => (
            <View style={[styles.headerBg, { height: headerBgHeight }]} />
          ),
          headerTitle: () => (
            <View style={styles.headerTitleWrap}>
              <Image
                source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />

      <AppContainer noPadding noBottomSafeArea>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: headerBgHeight - 60 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={GeckosColors.geckoGreen}
            />
          }
        >
          {/* ── REWARDS SECTION ── */}
          <SectionTitle>Rewards</SectionTitle>

          {!isLoggedIn ? (
            <SignInForRewards />
          ) : (
            <>
              {/* Points Balance Card */}
              <Card>
                {pointsLoading && totalPoints === 0 ? (
                  <View style={styles.pointsLoadingRow}>
                    <ActivityIndicator color={GeckosColors.geckoGreen} />
                    <GeckosText style={styles.pointsLoadingText}>Loading points…</GeckosText>
                  </View>
                ) : (
                  <>
                    <View style={styles.pointsBalanceRow}>
                      <View>
                        <View style={styles.pointsNumberRow}>
                          <GeckosText style={styles.pointsNumber}>
                            {totalPoints.toLocaleString()}
                          </GeckosText>
                          <GeckosText style={styles.pointsLabel}> pts</GeckosText>
                        </View>
                        <GeckosText style={styles.pointsLifetime}>
                          {lifetimePoints.toLocaleString()} pts earned lifetime
                        </GeckosText>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={28} color={GeckosColors.geckoGreen} />
                      </View>
                    </View>

                    <GeckosText style={styles.pointsRate}>10 pts earned per $1 spent</GeckosText>

                    {/* Progress bar */}
                    {nextTierReward ? (
                      <>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${progressPct * 100}%` },
                            ]}
                          />
                        </View>
                        <GeckosText style={styles.progressLabel}>
                          {ptsToNext} more pts until{" "}
                          <GeckosText style={styles.progressLabelBold}>
                            {nextTierReward.label}
                          </GeckosText>
                        </GeckosText>
                      </>
                    ) : (
                      <GeckosText style={styles.progressLabel}>
                        You've unlocked all rewards!
                      </GeckosText>
                    )}
                  </>
                )}
              </Card>

              {/* Reward Tiles */}
              <View style={styles.rewardsGrid}>
                {REWARDS.map((reward) => (
                  <RewardTile
                    key={reward.id}
                    reward={reward}
                    totalPoints={totalPoints}
                    onRedeem={handleRedeem}
                    isRedeeming={redeemingId === reward.id}
                  />
                ))}
              </View>

              {/* Recent Points History */}
              {transactions.length > 0 && (
                <Card>
                  <GeckosText style={styles.historyTitle}>Recent Activity</GeckosText>
                  {transactions.map((tx) => (
                    <View key={tx.id} style={styles.txRow}>
                      <View
                        style={[
                          styles.txDot,
                          tx.points > 0 ? styles.txDotEarned : styles.txDotRedeemed,
                        ]}
                      >
                        <Ionicons
                          name={tx.points > 0 ? "add" : "remove"}
                          size={12}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.txInfo}>
                        <GeckosText style={styles.txDesc}>
                          {tx.description ?? (tx.points > 0 ? "Points earned" : "Reward redeemed")}
                        </GeckosText>
                        <GeckosText style={styles.txDate}>
                          {formatRelativeDate(tx.created_at)}
                        </GeckosText>
                      </View>
                      <GeckosText
                        style={[
                          styles.txPoints,
                          tx.points > 0 ? styles.txPointsEarned : styles.txPointsRedeemed,
                        ]}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </GeckosText>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* ── DIVIDER ── */}
          <View style={styles.divider} />

          {/* ── WEEKLY SPECIAL ── */}
          <SectionTitle>Weekly Special</SectionTitle>

          <Card noPadding>
            <View style={styles.heroContainer}>
              <Image
                source={MARGARITA_IMAGE}
                style={styles.heroBgImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay}>
                <View style={styles.heroIconWrapBig}>
                  <Ionicons name="wine" size={32} color={GeckosColors.geckoGreen} />
                </View>
                <GeckosText style={styles.heroOverlayTitle}>
                  Half-Price Margaritas
                </GeckosText>
                <GeckosText style={styles.heroOverlaySubtitle}>
                  Every Tuesday • All Year Long
                </GeckosText>
                <GeckosText style={styles.heroOverlayBody}>
                  Bring your crew — Tuesday is Margarita Day at Gecko's.
                </GeckosText>
              </View>
            </View>
          </Card>

          {/* ── WHAT'S HAPPENING ── */}
          <View style={styles.sectionRow}>
            <SectionTitle>What's Happening</SectionTitle>
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed ? styles.refreshPressed : null,
              ]}
            >
              <Ionicons name="refresh" size={16} color={GeckosColors.text} />
              <GeckosText style={styles.refreshText}>Refresh</GeckosText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={GeckosColors.geckoGreen} />
              <GeckosText style={styles.loadingText}>Loading updates…</GeckosText>
            </View>
          ) : errorMessage ? (
            <Card>
              <View style={styles.noticeRow}>
                <Ionicons name="alert-circle" size={18} color={GeckosColors.mutedText} />
                <GeckosText style={styles.noticeText}>{errorMessage}</GeckosText>
              </View>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <View style={styles.noticeRow}>
                <Ionicons name="information-circle" size={18} color={GeckosColors.mutedText} />
                <GeckosText style={styles.noticeText}>
                  No updates posted right now. Pull to refresh, or check back soon.
                </GeckosText>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 16 }}>
              {events.map((ev, idx) => {
                const dateLabel = formatEventDate(ev.date);
                const timeLabel = formatTimeRange(ev.startTime, ev.endTime);
                const key = `${ev.title}-${ev.date}-${idx}`;
                const showImage = !!ev.imageUrl && !badEventImages[ev.imageUrl];

                return (
                  <Card key={key} noPadding>
                    {showImage ? (
                      <Image
                        source={{ uri: ev.imageUrl }}
                        style={styles.eventImage}
                        resizeMode="cover"
                        onError={() =>
                          setBadEventImages((prev) => ({ ...prev, [ev.imageUrl]: true }))
                        }
                      />
                    ) : null}
                    <View style={styles.eventInner}>
                      <View style={styles.eventTopRow}>
                        <EventTypePill type={ev.type} />
                        <GeckosText style={styles.eventDate}>{dateLabel}</GeckosText>
                      </View>
                      <GeckosText style={styles.eventTitle}>{ev.title}</GeckosText>
                      {!!timeLabel && (
                        <View style={styles.eventMetaRow}>
                          <Ionicons name="time" size={14} color={GeckosColors.mutedText} />
                          <GeckosText style={styles.eventMetaText}>{timeLabel}</GeckosText>
                        </View>
                      )}
                      {!!ev.details && (
                        <GeckosText style={styles.eventDetails}>{ev.details}</GeckosText>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* ── CALL BUTTON ── */}
          <Pressable
            onPress={() => safeOpenUrl(`tel:${PHONE_DIAL}`)}
            style={({ pressed }) => [
              styles.callButton,
              pressed ? styles.callPressed : null,
            ]}
          >
            <Ionicons name="call" size={18} color={GeckosColors.background} />
            <GeckosText style={styles.callButtonText}>Call {PHONE_DISPLAY}</GeckosText>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </AppContainer>
    </>
  );
}

/* ─────────────────────── STYLES ─────────────────────── */

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: GeckosColors.background,
    borderBottomWidth: 1,
    borderBottomColor: GeckosColors.background,
  },
  headerTitleWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 1,
  },
  headerLogo: {
    height: 28,
    width: 150,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 56,
    backgroundColor: GeckosColors.background,
    gap: 18,
  },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 2,
    fontSize: 20,
    fontWeight: "900",
    color: GeckosColors.text,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 18,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardNoPadding: {
    padding: 0,
    gap: 0,
  },

  /* ── POINTS BALANCE ── */
  pointsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  pointsLoadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  pointsBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pointsNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  pointsNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
    lineHeight: 54,
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  pointsLifetime: {
    fontSize: 12,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },
  pointsBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.25)",
  },
  pointsRate: {
    fontSize: 12,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    marginTop: -4,
  },

  /* ── PROGRESS ── */
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: GeckosColors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    marginTop: -4,
  },
  progressLabelBold: {
    color: GeckosColors.text,
    fontWeight: "900",
  },

  /* ── REWARD TILES ── */
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  rewardTile: {
    width: "47%",
    backgroundColor: GeckosColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 16,
    gap: 6,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rewardTileEligible: {
    borderColor: "rgba(74, 222, 128, 0.4)",
    backgroundColor: "rgba(74, 222, 128, 0.05)",
  },
  rewardTileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: GeckosColors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  rewardTileIconWrapEligible: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  rewardTilePts: {
    fontSize: 11,
    fontWeight: "900",
    color: GeckosColors.mutedText,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  rewardTileLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.text,
    lineHeight: 20,
  },
  rewardTileLabelEligible: {
    color: GeckosColors.text,
  },
  redeemBtn: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    alignSelf: "stretch",
    alignItems: "center",
    minHeight: 34,
    justifyContent: "center",
  },
  redeemBtnPressed: { opacity: 0.85 },
  redeemBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: GeckosColors.background,
  },
  rewardNeedText: {
    fontSize: 12,
    fontWeight: "800",
    color: GeckosColors.mutedText,
    marginTop: 4,
  },

  /* ── SIGN IN PROMPT ── */
  signInRow: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  signInIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.25)",
    marginBottom: 4,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.text,
    textAlign: "center",
  },
  signInBody: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: 6,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    alignSelf: "stretch",
    alignItems: "center",
  },
  signInBtnPressed: { opacity: 0.85 },
  signInBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.background,
  },

  /* ── TRANSACTION HISTORY ── */
  historyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: GeckosColors.text,
    marginBottom: 4,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: GeckosColors.border,
  },
  txDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txDotEarned: { backgroundColor: GeckosColors.geckoGreen },
  txDotRedeemed: { backgroundColor: GeckosColors.chiliRed ?? "#e84a4a" },
  txInfo: { flex: 1 },
  txDesc: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.text,
  },
  txDate: {
    fontSize: 11,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 1,
  },
  txPoints: {
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 0,
  },
  txPointsEarned: { color: GeckosColors.geckoGreen },
  txPointsRedeemed: { color: GeckosColors.chiliRed ?? "#e84a4a" },

  /* ── DIVIDER ── */
  divider: {
    height: 1,
    backgroundColor: GeckosColors.border,
    marginVertical: 4,
  },

  /* ── WEEKLY SPECIAL HERO ── */
  heroContainer: {
    height: 300,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  heroBgImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 24,
  },
  heroIconWrapBig: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroOverlayTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
  },
  heroOverlaySubtitle: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
    marginVertical: 4,
  },
  heroOverlayBody: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },

  /* ── EVENTS ── */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
  },
  refreshPressed: { opacity: 0.85 },
  refreshText: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    lineHeight: 18,
  },
  eventImage: {
    width: "100%",
    height: 180,
    backgroundColor: GeckosColors.background,
  },
  eventInner: {
    padding: 18,
    gap: 8,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventDate: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.mutedText,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventMetaText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.mutedText,
  },
  eventDetails: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.text,
    lineHeight: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.background,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900",
    color: GeckosColors.text,
  },

  /* ── CALL BUTTON ── */
  callButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: GeckosColors.geckoGreen,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  callPressed: { opacity: 0.9 },
  callButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: GeckosColors.background,
  },
});