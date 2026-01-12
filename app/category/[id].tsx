// app/category/[id].tsx
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";

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

import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from "@/src/data/menu";
import { GeckosColors } from "@/src/theme/colors";

/** Header sizing (same approach as menu.tsx) */
const HEADER_BAR_HEIGHT = 44; // pinch here (40–52)
const HEADER_CONTENT_TOP_PAD = 1; // move logo a hair
const LIST_TOP_GAP = -44; // space under header before title/list

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

const THUMB_WIDTH = 150;

/** ✅ MAKE ROWS TALLER (more room, fewer rows per screen) */
const ROW_HEIGHT = 153; // try 104–128

function splitPriceLines(priceText: string) {
  return priceText
    .split(/\n|\|/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PriceBlock({ item }: { item: MenuItem }) {
  if (typeof item.price === "number") {
    return (
      <GeckosText style={styles.priceLine}>${item.price.toFixed(2)}</GeckosText>
    );
  }

  if (item.priceText) {
    const lines = splitPriceLines(item.priceText);

    if (lines.length <= 1) {
      return <GeckosText style={styles.priceLine}>{item.priceText}</GeckosText>;
    }

    return (
      <View style={styles.priceStack}>
        {lines.map((line) => (
          <GeckosText key={line} style={styles.priceStackLine}>
            {line}
          </GeckosText>
        ))}
      </View>
    );
  }

  return null;
}

function ItemRow({ item, categoryId }: { item: MenuItem; categoryId: string }) {
  const imageMap = IMAGE_MAP_BY_CATEGORY[categoryId];
  const image = imageMap?.[item.id];
  const showImageSlot = Boolean(imageMap);

  return (
    <View style={styles.itemRow}>
      {showImageSlot ? (
        <View style={styles.mediaWrap}>
          {image ? (
            <Image source={image} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.missingThumb}>
              <GeckosText style={styles.missingThumbText}>No photo</GeckosText>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.itemContent}>
        <View style={styles.itemTop}>
          <GeckosText style={styles.itemName}>{item.name}</GeckosText>

          <View style={styles.priceWrap}>
            <PriceBlock item={item} />
          </View>
        </View>

        {item.description ? (
          <GeckosText variant="muted" style={styles.itemDesc}>
            {item.description}
          </GeckosText>
        ) : null}
      </View>
    </View>
  );
}

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = String(id);

  const categoryTitle =
    MENU_CATEGORIES.find((c) => c.id === categoryId)?.title ?? "Category";

  const items = MENU_ITEMS.filter((m) => m.categoryId === categoryId);

  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;

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

          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <GeckosText style={styles.backText}>Back</GeckosText>
            </Pressable>
          ),

          headerTitle: () => (
            <View
              style={[
                styles.headerTitleWrap,
                { paddingTop: HEADER_CONTENT_TOP_PAD },
              ]}
            >
              <Image
                source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          ),

          headerLargeTitle: false,
        }}
      />

      <AppContainer noPadding noBottomSafeArea>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <ItemRow item={item} categoryId={categoryId} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <GeckosText variant="muted" style={styles.empty}>
              No items yet.
            </GeckosText>
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <GeckosText variant="title" style={styles.pageTitle}>
                {categoryTitle}
              </GeckosText>

              {categoryId === "lunch-specials" && (
                <View style={styles.lunchInfo}>
                  <GeckosText style={styles.sectionTitle}>Choose from:</GeckosText>
                  <GeckosText variant="muted">
                    Cheese Enchilada, Chicken Enchilada, Beef Enchilada, Crispy Taco,
                    Bean Tostada, Beef Tostada, Guacamole Tostada, Beef Burrito,
                    Cheese Burrito.
                  </GeckosText>

                  <GeckosText style={styles.sectionTitle}>Sauce Choices:</GeckosText>
                  <GeckosText variant="muted">
                    Chili, Ranchero, Sour Cream Sauce, Yellow Queso, White Queso
                    (+$0.50)
                  </GeckosText>
                </View>
              )}
            </View>
          }
          contentContainerStyle={[
            styles.list,
            { paddingTop: headerBgHeight + LIST_TOP_GAP },
          ]}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: GeckosColors.background,
    borderBottomWidth: 1,
    borderBottomColor: GeckosColors.border,
  },
  headerTitleWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogo: {
    height: 28,
    width: 150,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backText: {
    color: GeckosColors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  pressed: { opacity: 0.7 },

  list: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  listHeader: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 34,
    color: GeckosColors.text,
    letterSpacing: 0.5,
    paddingBottom: 10,
  },

  lunchInfo: {
    marginTop: 10,
    gap: 6,
  },
  sectionTitle: {
    marginTop: 4,
    fontWeight: "700",
    color: GeckosColors.text,
  },

  separator: { height: 12 },
  empty: { marginTop: 16 },

  itemRow: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    height: ROW_HEIGHT,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  mediaWrap: {
    width: THUMB_WIDTH,
    backgroundColor: "#1B241E",
  },
  thumb: {
    width: THUMB_WIDTH,
    height: ROW_HEIGHT,
  },
  missingThumb: {
    width: THUMB_WIDTH,
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F1F1F",
  },
  missingThumbText: {
    color: "#F2F3F5",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  itemContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: "center",
    minWidth: 0,
  },

  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0, // ✅ key for flex rows
  },

  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: GeckosColors.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 0, // ✅ remove extra squeeze
    lineHeight: 20,
  },

  // ✅ FIX: no hard 120px column. Cap it instead.
  priceWrap: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 1,
    flexShrink: 0,
    minWidth: 78,
    maxWidth: 110,
  },

  priceLine: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.text,
    textAlign: "right",
  },

  priceStack: {
    alignItems: "flex-end",
    gap: 3,
  },
  priceStackLine: {
    fontSize: 13,
    fontWeight: "700",
    color: GeckosColors.text,
    textAlign: "right",
    lineHeight: 16,
  },

  itemDesc: {
    marginTop: 8,
    lineHeight: 18,
  },
});
