import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useMenu } from "@/src/context/MenuContext";
import { supabase } from "@/src/lib/supabase";
import { CATEGORY_IMAGES } from "@/src/constants/category-images";

/* ─────────────────────── CONFIG ─────────────────────── */

const HEADER_BAR_HEIGHT = 48;

const RESTAURANT_NAME = "Gecko's at Lake Texoma";
const ADDRESS_LINE1 = "1006 HWY 70 E";
const ADDRESS_LINE2 = "Kingston, OK 73439";
const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

const LAT = 33.9990;
const LNG = -96.7045;

const MAP_URL =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${LNG - 0.025},${LAT - 0.018},${LNG + 0.025},${LAT + 0.018}` +
  `&layer=mapnik&marker=${LAT},${LNG}`;

const APPLE_MAPS_URL = `maps://?q=${encodeURIComponent(RESTAURANT_NAME)}&ll=${LAT},${LNG}`;
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${RESTAURANT_NAME} ${ADDRESS_LINE1} ${ADDRESS_LINE2}`
)}`;

/* ─────────────────────── HELPERS ─────────────────────── */

function getFirstName(session: any): string | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  const full: string = meta.full_name || meta.name || "";
  if (full.trim()) return full.trim().split(/\s+/)[0];
  const prefix: string = (session.user.email ?? "").split("@")[0];
  if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return null;
}

function openUrl(url: string, fallback?: string) {
  Linking.canOpenURL(url)
    .then((ok) => {
      if (ok) return Linking.openURL(url);
      if (fallback) return Linking.openURL(fallback);
    })
    .catch(() => {});
}

function openMaps(type: "apple" | "google") {
  if (type === "apple") openUrl(APPLE_MAPS_URL, GOOGLE_MAPS_URL);
  else openUrl(GOOGLE_MAPS_URL);
}

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

function LocationTapCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.locationCard, pressed && styles.locationCardPressed]}
    >
      <View style={styles.locationIconWrap}>
        <Ionicons name="location" size={22} color={GeckosColors.geckoGreen} />
      </View>
      <View style={styles.locationTextCol}>
        <GeckosText style={styles.locationName}>{RESTAURANT_NAME}</GeckosText>
        <GeckosText style={styles.locationAddress}>
          {ADDRESS_LINE1} · {ADDRESS_LINE2}
        </GeckosText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GeckosColors.mutedText} />
    </Pressable>
  );
}

function CategoryCard({
  id,
  label,
  imageSource,
}: {
  id: string;
  label: string;
  imageSource: any;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/category/${id}` as any)}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.categoryImage} resizeMode="cover" />
      ) : (
        <View style={[styles.categoryImage, styles.categoryImagePlaceholder]} />
      )}
      <View style={styles.categoryOverlay}>
        <GeckosText style={styles.categoryLabel}>{label}</GeckosText>
      </View>
    </Pressable>
  );
}

function RewardsTeaser({ points }: { points: number | null }) {
  const nextRewardPts =
    points === null ? null
    : points < 250 ? 250
    : points < 500 ? 500
    : points < 1000 ? 1000
    : points < 2000 ? 2000
    : null;
  const ptsToNext =
    nextRewardPts !== null && points !== null ? nextRewardPts - points : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.rewardsTeaser, pressed && styles.rewardsTeaserPressed]}
      onPress={() => router.push("/(tabs)/rewards")}
    >
      <View style={styles.rewardsTeaserLeft}>
        <View style={styles.rewardsTeaserIconWrap}>
          <Ionicons name="star" size={20} color={GeckosColors.geckoGreen} />
        </View>
        <View>
          <GeckosText style={styles.rewardsTeaserTitle}>
            {points === null ? "Gecko's Rewards" : `${points.toLocaleString()} pts`}
          </GeckosText>
          <GeckosText style={styles.rewardsTeaserSub}>
            {ptsToNext !== null
              ? `${ptsToNext} pts until your next reward`
              : points === null
              ? "Earn 10 pts per $1 spent"
              : "All rewards unlocked!"}
          </GeckosText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={GeckosColors.mutedText} />
    </Pressable>
  );
}

/* ─────────────────────── LOCATION MODAL ─────────────────────── */

function LocationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [mapError, setMapError] = useState(false);

  const handleCall = () => {
    if (Platform.OS === "ios" && Platform.isPad) {
      Alert.alert("Call Gecko's", PHONE_DISPLAY, [{ text: "OK" }]);
      return;
    }
    Linking.openURL(`tel:${PHONE_DIAL}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={() => {}}
        >
          <View style={styles.modalHandle} />

          <GeckosText style={styles.modalOrderingFrom}>You are ordering from:</GeckosText>
          <GeckosText style={styles.modalRestaurantName}>{RESTAURANT_NAME}</GeckosText>
          <GeckosText style={styles.modalAddress}>
            {ADDRESS_LINE1}, {ADDRESS_LINE2}
          </GeckosText>

          <View style={styles.mapContainer}>
            {mapError ? (
              <View style={styles.mapFallback}>
                <Ionicons name="map-outline" size={28} color={GeckosColors.mutedText} />
                <GeckosText style={styles.mapFallbackText}>Map unavailable</GeckosText>
              </View>
            ) : (
              <WebView
                source={{ uri: MAP_URL }}
                style={styles.mapWebView}
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                onError={() => setMapError(true)}
              />
            )}
          </View>

          <View style={styles.mapButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.mapButton, styles.mapButtonPrimary, pressed && styles.mapButtonPressed]}
              onPress={() => openMaps("apple")}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <GeckosText style={styles.mapButtonPrimaryText}>Apple Maps</GeckosText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.mapButton, styles.mapButtonSecondary, pressed && styles.mapButtonPressed]}
              onPress={() => openMaps("google")}
            >
              <Ionicons name="map-outline" size={16} color={GeckosColors.text} />
              <GeckosText style={styles.mapButtonSecondaryText}>Google Maps</GeckosText>
            </Pressable>
          </View>

          <View style={styles.mapButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.mapButton, styles.mapButtonCall, pressed && styles.mapButtonPressed]}
              onPress={handleCall}
            >
              <Ionicons name="call" size={16} color={GeckosColors.geckoGreen} />
              <GeckosText style={styles.mapButtonCallText}>{PHONE_DISPLAY}</GeckosText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.mapButton, styles.mapButtonDismiss, pressed && styles.mapButtonPressed]}
              onPress={onClose}
            >
              <GeckosText style={styles.mapButtonDismissText}>Dismiss</GeckosText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─────────────────────── SCREEN ─────────────────────── */

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  emoji: string;
  image_url: string | null;
};

type AppSpecial = {
  id: string;
  label: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;
  const { session, isLoggedIn, profile } = useAuth();
  const { itemCount } = useCart();
  const { categories } = useMenu();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean | null>(null);
  const [activeSpecial, setActiveSpecial] = useState<AppSpecial | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const fetchPoints = useCallback(async () => {
    if (!session?.user?.id) { setTotalPoints(null); return; }
    const { data: pts } = await supabase
      .from("customer_points")
      .select("total_points")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setTotalPoints(pts?.total_points ?? 0);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isLoggedIn) { setTotalPoints(null); return; }
    void fetchPoints();
  }, [fetchPoints, isLoggedIn]);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("id, title, body, emoji, image_url")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setAnnouncements(data ?? []));
  }, []);

  useEffect(() => {
    supabase.rpc("is_accepting_orders").then(({ data }) => {
      setIsAcceptingOrders(data ?? true);
    });
  }, []);

  useEffect(() => {
    supabase
      .from("app_specials")
      .select("id, label, title, subtitle, image_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setActiveSpecial(data ?? null));
  }, []);

  // Cart-aware primary CTA: if items in cart → go to order, else → browse menu
  const primaryLabel = itemCount > 0
    ? `View Order · ${itemCount} item${itemCount !== 1 ? "s" : ""}`
    : "Browse Menu";
  const primaryDest = itemCount > 0 ? "/(tabs)/order" : "/(tabs)/menu";

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Header with small logo — same as all other screens */}
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

      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — dark background with logo */}
          <View style={styles.heroContainer}>
            {/* Location card — just below the header bar */}
            <View style={[styles.heroLocationArea, { paddingTop: headerBgHeight + 20 }]}>
              <LocationTapCard onPress={() => setLocationModalVisible(true)} />
            </View>

            {/* Greeting — fills remaining hero space */}
            <View style={styles.heroGreetingArea}>
              {isLoggedIn ? (
                <>
                  <GeckosText style={styles.heroGreetingLine}>Hey,</GeckosText>
                  <GeckosText style={styles.heroGreetingName}>
                    {(profile?.display_name?.split(/\s+/)[0] ?? getFirstName(session)) ?? "there"}
                  </GeckosText>
                  {totalPoints !== null && (
                    <View style={styles.heroPointsBadge}>
                      <Ionicons name="star" size={13} color={GeckosColors.geckoGreen} />
                      <GeckosText style={styles.heroPointsText}>
                        {totalPoints.toLocaleString()} pts
                      </GeckosText>
                    </View>
                  )}
                  <GeckosText style={styles.heroGreetingSub}>
                    What are you craving today?
                  </GeckosText>
                </>
              ) : (
                <>
                  <GeckosText style={styles.heroGreetingLine}>Welcome to</GeckosText>
                  <GeckosText style={styles.heroGreetingBrand}>Gecko&apos;s</GeckosText>
                  <GeckosText style={styles.heroGreetingSub}>
                    Lake Texoma&apos;s favorite Mexican food
                  </GeckosText>
                </>
              )}
            </View>
          </View>

          {/* 3. Content card — slides up over hero bottom */}
          <View style={styles.contentCard}>

            {/* Primary CTA — cart-aware */}
            <Pressable
              style={({ pressed }) => [styles.ctaPrimary, itemCount > 0 && styles.ctaPrimaryCart, pressed && styles.ctaPressed]}
              onPress={() => router.push(primaryDest as any)}
            >
              <Ionicons
                name={itemCount > 0 ? "bag-check-outline" : "restaurant-outline"}
                size={20}
                color="#fff"
              />
              <GeckosText style={styles.ctaPrimaryText}>{primaryLabel}</GeckosText>
            </Pressable>

            {/* Secondary CTA — always Browse Menu (only show when cart has items, to avoid duplicate) */}
            {itemCount > 0 && (
              <Pressable
                style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaSecondaryPressed]}
                onPress={() => router.push("/(tabs)/menu")}
              >
                <Ionicons name="restaurant-outline" size={20} color={GeckosColors.text} />
                <GeckosText style={styles.ctaSecondaryText}>Browse Menu</GeckosText>
              </Pressable>
            )}

            {/* Rewards teaser (logged in) */}
            {isLoggedIn && <RewardsTeaser points={totalPoints} />}

            {/* Sign-in nudge (not logged in) */}
            {!isLoggedIn && (
              <Pressable
                style={({ pressed }) => [styles.signInNudge, pressed && styles.signInNudgePressed]}
                onPress={() => router.push("/auth" as any)}
              >
                <Ionicons name="star-outline" size={16} color={GeckosColors.geckoGreen} />
                <GeckosText style={styles.signInNudgeText}>
                  Sign in to earn rewards on every order
                </GeckosText>
                <Ionicons name="chevron-forward" size={14} color={GeckosColors.mutedText} />
              </Pressable>
            )}

            {/* Kitchen closed banner */}
            {isAcceptingOrders === false && (
              <View style={styles.closedBanner}>
                <Ionicons name="time-outline" size={16} color="#D97706" />
                <GeckosText style={styles.closedBannerText}>
                  Kitchen is currently closed — online ordering is paused. Call us at {PHONE_DISPLAY}.
                </GeckosText>
              </View>
            )}

            {/* Category grid */}
            <View style={styles.categoriesHeader}>
              <GeckosText style={styles.sectionTitle}>Explore the Menu</GeckosText>
              <Pressable
                onPress={() => router.push("/(tabs)/menu")}
                style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
              >
                <GeckosText style={styles.seeAllText}>See All</GeckosText>
                <Ionicons name="chevron-forward" size={13} color={GeckosColors.geckoGreen} />
              </Pressable>
            </View>

            <View style={styles.categoryGrid}>
              {(showAllCategories ? categories : categories.slice(0, 6)).map((cat) => {
                const remoteUri = cat.imageUrl ?? null;
                const localAsset = (CATEGORY_IMAGES as Record<string, any>)[cat.id];
                const imageSource = remoteUri ? { uri: remoteUri } : localAsset ?? null;
                return (
                  <CategoryCard
                    key={cat.id}
                    id={cat.id}
                    label={cat.title}
                    imageSource={imageSource}
                  />
                );
              })}
            </View>

            {categories.length > 6 && (
              <Pressable
                onPress={() => setShowAllCategories((v) => !v)}
                style={({ pressed }) => [styles.showAllBtn, pressed && { opacity: 0.7 }]}
              >
                <GeckosText style={styles.showAllBtnText}>
                  {showAllCategories
                    ? "Show less"
                    : `Show all ${categories.length} categories`}
                </GeckosText>
                <Ionicons
                  name={showAllCategories ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={GeckosColors.geckoGreen}
                />
              </Pressable>
            )}

            {/* What's Happening */}
            {announcements.length > 0 && (
              <View style={styles.announcementsSection}>
                <GeckosText style={styles.sectionTitle}>What&apos;s Happening</GeckosText>
                {announcements.map((item) => (
                  <View key={item.id} style={styles.announcementCard}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.announcementImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.announcementContent}>
                      <GeckosText style={styles.announcementEmoji}>{item.emoji}</GeckosText>
                      <View style={styles.announcementBody}>
                        <GeckosText style={styles.announcementTitle}>{item.title}</GeckosText>
                        {item.body ? (
                          <GeckosText style={styles.announcementText}>{item.body}</GeckosText>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Weekly Special banner — editable via staff dashboard */}
            {activeSpecial !== null && (
              <View style={styles.specialBanner}>
                <Image
                  source={activeSpecial.image_url ? { uri: activeSpecial.image_url } : require("../../assets/more/margarita.jpg")}
                  style={styles.specialBannerBg}
                  resizeMode="cover"
                />
                <View style={styles.specialBannerOverlay}>
                  <View style={styles.specialBannerRow}>
                    <Ionicons name="wine" size={20} color={GeckosColors.geckoGreen} />
                    <GeckosText style={styles.specialBannerLabel}>{activeSpecial.label}</GeckosText>
                  </View>
                  <GeckosText style={styles.specialBannerTitle}>{activeSpecial.title}</GeckosText>
                  {activeSpecial.subtitle ? (
                    <GeckosText style={styles.specialBannerSub}>{activeSpecial.subtitle}</GeckosText>
                  ) : null}
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </View>

      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </>
  );
}

/* ─────────────────────── STYLES ─────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GeckosColors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 32,
  },

  /* ── HEADER ── */
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

  /* ── LOCATION CARD ── */
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  locationCardPressed: { opacity: 0.85 },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(20, 143, 26, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 143, 26, 0.25)",
    flexShrink: 0,
  },
  locationTextCol: { flex: 1 },
  locationName: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 2,
  },

  /* ── HERO ── */
  heroContainer: {
    backgroundColor: GeckosColors.background,
  },
  heroBg: {
    flex: 1,
  },
  heroOverlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroLocationArea: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  heroLogoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 28,
  },
  heroLogo: {
    width: 320,
    height: 120,
  },

  /* ── HERO GREETING ── */
  heroGreetingArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroGreetingLine: {
    fontSize: 16,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginBottom: 2,
  },
  heroGreetingName: {
    fontSize: 42,
    fontWeight: "900",
    color: GeckosColors.text,
    lineHeight: 48,
    marginBottom: 10,
  },
  heroGreetingBrand: {
    fontSize: 42,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
    lineHeight: 48,
    marginBottom: 10,
  },
  heroGreetingSub: {
    fontSize: 15,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 4,
  },
  heroPointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(20, 143, 26, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(20, 143, 26, 0.25)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroPointsText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  /* ── CONTENT CARD ── */
  contentCard: {
    backgroundColor: GeckosColors.background,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },

  /* ── CTAs ── */
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 999,
    paddingVertical: 17,
    shadowColor: GeckosColors.geckoGreen,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaPrimaryCart: {
    backgroundColor: "#206c50", // slightly different green when it's a "view order" CTA
  },
  ctaPressed: { opacity: 0.88 },
  ctaPrimaryText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "transparent",
    borderRadius: 999,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: GeckosColors.border,
  },
  ctaSecondaryPressed: { opacity: 0.75 },
  ctaSecondaryText: {
    fontSize: 17,
    fontWeight: "900",
    color: GeckosColors.text,
    letterSpacing: 0.2,
  },

  /* ── REWARDS TEASER ── */
  rewardsTeaser: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(20, 143, 26, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 143, 26, 0.22)",
    padding: 14,
  },
  rewardsTeaserPressed: { opacity: 0.85 },
  rewardsTeaserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rewardsTeaserIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(20, 143, 26, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rewardsTeaserTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  rewardsTeaserSub: {
    fontSize: 12,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    marginTop: 1,
  },

  /* ── SIGN IN NUDGE ── */
  signInNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: GeckosColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  signInNudgePressed: { opacity: 0.8 },
  signInNudgeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },

  /* ── CATEGORIES ── */
  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: GeckosColors.text,
    letterSpacing: 0.2,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "47.5%",
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: GeckosColors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryCardPressed: { opacity: 0.88 },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    backgroundColor: GeckosColors.surface,
    marginTop: -4,
  },
  showAllBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  categoryImagePlaceholder: {
    backgroundColor: "#1F2920",
  },
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.35)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closedBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#D97706",
    lineHeight: 18,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.46)",
    justifyContent: "flex-end",
    padding: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 18,
  },

  /* ── WHAT'S HAPPENING ── */
  announcementsSection: {
    gap: 10,
  },
  announcementCard: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    overflow: "hidden",
  },
  announcementImage: {
    width: "100%",
    height: 160,
  },
  announcementContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  announcementEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  announcementBody: {
    flex: 1,
    gap: 3,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: GeckosColors.text,
  },
  announcementText: {
    fontSize: 13,
    fontWeight: "600",
    color: GeckosColors.mutedText,
    lineHeight: 18,
  },

  /* ── TUESDAY SPECIAL ── */
  specialBanner: {
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 6,
  },
  specialBannerBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  specialBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
    justifyContent: "flex-end",
    padding: 18,
  },
  specialBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  specialBannerLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  specialBannerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 24,
  },
  specialBannerSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  /* ── LOCATION MODAL ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: GeckosColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderColor: GeckosColors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GeckosColors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalOrderingFrom: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
  },
  modalRestaurantName: {
    fontSize: 22,
    fontWeight: "900",
    color: GeckosColors.text,
    lineHeight: 26,
    marginTop: -4,
  },
  modalAddress: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.mutedText,
    marginTop: -4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GeckosColors.surface,
    gap: 8,
  },
  mapFallbackText: {
    fontSize: 14,
    fontWeight: "600",
    color: GeckosColors.mutedText,
  },
  mapWebView: {
    flex: 1,
    backgroundColor: GeckosColors.surface,
  },
  mapButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  mapButtonPressed: { opacity: 0.85 },
  mapButtonPrimary: {
    backgroundColor: GeckosColors.geckoGreen,
    borderColor: GeckosColors.geckoGreen,
  },
  mapButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  mapButtonSecondary: {
    backgroundColor: "transparent",
    borderColor: GeckosColors.border,
  },
  mapButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.text,
  },
  mapButtonCall: {
    backgroundColor: "transparent",
    borderColor: "rgba(20, 143, 26, 0.35)",
  },
  mapButtonCallText: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.geckoGreen,
  },
  mapButtonDismiss: {
    backgroundColor: "transparent",
    borderColor: GeckosColors.border,
  },
  mapButtonDismissText: {
    fontSize: 14,
    fontWeight: "900",
    color: GeckosColors.mutedText,
  },
});
