import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";

/* ------------------ CONFIG ------------------ */

const EVENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwCbEHB99zyAVu3LnuHK5lum6Ske0flTYmSCynDsJdNwfyEx-LV9evVS-ZVUOCj_O461BjR7yMDYPN/pub?output=csv";

const PHONE_DISPLAY = "580-564-9599";
const PHONE_DIAL = "5805649599";

const MARGARITA_IMAGE = require("../../assets/more/margarita.jpg");
const TOGO_IMAGE = require("../../assets/more/toGo.jpg");
const CATERING_IMAGE = require("../../assets/more/catering.jpg");
const PARTIES_IMAGE = require("../../assets/more/parties.jpg");
const MERCH_IMAGE = require("../../assets/more/merch.jpg");
const GIFT_CARDS_IMAGE = require("../../assets/more/giftCards.jpg");

const HEADER_BAR_HEIGHT = 48;

/* ------------------ TYPES & HELPERS ------------------ */
// (unchanged – all helpers and types same as before)

function safeOpenUrl(url: string) {
  if (!url) return;
  Linking.openURL(url).catch(() => {});
}

// ... (parseCSV, normalizeEventType, formatEventDate, formatTimeRange unchanged)

function parseCSV(csvText: string): Record<string, string>[] {
  // same as before
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
      if (inQuotes && next === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushField();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      pushField();
      pushRow();
      continue;
    }

    currentField += char;
  }

  pushField();
  pushRow();

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => (h ?? "").trim());
  const dataRows = rows.slice(1);

  return dataRows.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
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

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return yyyyMmDd;

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  if (s) return `${toPretty(s)}`;
  return `${toPretty(e)}`;
}

/* ------------------ UI COMPONENTS ------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <GeckosText style={styles.sectionTitle}>{children}</GeckosText>;
}

function EventTypePill({ type }: { type: EventType }) {
  const { label, icon } = useMemo(() => {
    if (type === "music")
      return { label: "Live Music", icon: "musical-notes" as const };
    if (type === "special") return { label: "Special", icon: "pricetag" as const };
    if (type === "closure")
      return { label: "Closure", icon: "alert-circle" as const };
    return { label: "Update", icon: "information-circle" as const };
  }, [type]);

  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color={GeckosColors.text} />
      <GeckosText style={styles.pillText}>{label}</GeckosText>
    </View>
  );
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

const SERVICE_ICONS = {
  togo: "car" as const,
  catering: "basket" as const,
  parties: "balloon" as const,
  merch: "shirt" as const,
  gifts: "gift" as const,
};

function ServiceCard({
  image,
  title,
  body,
  icon,
}: {
  image: any;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.serviceCard,
        pressed && styles.serviceCardPressed,
      ]}
    >
      <View style={styles.serviceImageContainer}>
        <Image source={image} style={styles.serviceImage} resizeMode="cover" />
        <View style={styles.serviceIconBadge}>
          <Ionicons name={icon} size={32} color={GeckosColors.geckoGreen} />
        </View>
      </View>
      <View style={styles.serviceTextPanel}>
        <GeckosText style={styles.serviceTitle}>{title}</GeckosText>
        <GeckosText style={styles.serviceBody}>{body}</GeckosText>
      </View>
    </Pressable>
  );
}

/* ------------------ SCREEN ------------------ */

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<GeckosEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [badEventImages, setBadEventImages] = useState<Record<string, true>>({});

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
      setErrorMessage(
        "Couldn’t load updates right now. Pull to refresh, or try again later."
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

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
          {/* WEEKLY SPECIAL */}
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

          {/* EVENTS */}
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
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={GeckosColors.mutedText}
                />
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
                          setBadEventImages((prev) => ({
                            ...prev,
                            [ev.imageUrl]: true,
                          }))
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
                          <GeckosText style={styles.eventMetaText}>
                            {timeLabel}
                          </GeckosText>
                        </View>
                      )}

                      {!!ev.details && (
                        <GeckosText style={styles.eventDetails}>
                          {ev.details}
                        </GeckosText>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* CATERING & MORE – FINAL CLEAN DESIGN */}
          <SectionTitle>Catering & More</SectionTitle>

          <View style={styles.servicesGrid}>
            <ServiceCard
              image={TOGO_IMAGE}
              title="To-Go"
              body="Take our delicious food anywhere. Convenient drive-through pickup — call 580-564-9599!"
              icon={SERVICE_ICONS.togo}
            />
            <ServiceCard
              image={CATERING_IMAGE}
              title="Catering"
              body="Big or small events — we'll make it fantastic. Call us today!"
              icon={SERVICE_ICONS.catering}
            />
            <ServiceCard
              image={PARTIES_IMAGE}
              title="Parties"
              body="Birthdays, graduations & more. Private room + patio — book now!"
              icon={SERVICE_ICONS.parties}
            />
            <ServiceCard
              image={MERCH_IMAGE}
              title="Merchandise"
              body="Hats, hoodies & more — rep Gecko's all year long."
              icon={SERVICE_ICONS.merch}
            />
            <ServiceCard
              image={GIFT_CARDS_IMAGE}
              title="Gift Cards"
              body="The perfect gift of great food. Ask your server or grab at drive-through."
              icon={SERVICE_ICONS.gifts}
            />
          </View>

          <Pressable
            onPress={() => safeOpenUrl(`tel:${PHONE_DIAL}`)}
            style={({ pressed }) => [
              styles.callButton,
              pressed ? styles.callPressed : null,
            ]}
          >
            <Ionicons name="call" size={18} color={GeckosColors.background} />
            <GeckosText style={styles.callButtonText}>
              Call {PHONE_DISPLAY}
            </GeckosText>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </AppContainer>
    </>
  );
}

/* ------------------ STYLES ------------------ */

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

  /* HERO SPECIAL */
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

  /* EVENTS */
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

  /* CATERING & MORE – CLEAN SEPARATED DESIGN */
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },

  serviceCard: {
    width: "46%",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: GeckosColors.surface,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  serviceCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },

  serviceImageContainer: {
    height: 180,
    position: "relative",
  },

  serviceImage: {
    width: "100%",
    height: "100%",
  },

  serviceIconBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 43,
    height: 43,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: GeckosColors.geckoGreen,
  },

  serviceTextPanel: {
    backgroundColor: "#1a1a1a", // solid dark for perfect contrast
    padding: 18,
  },

  serviceTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },

  serviceBody: {
    fontSize: 13.5,
    color: "#e0e0e0",
    lineHeight: 19,
    fontWeight: "600",
  },

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