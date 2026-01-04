import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, Image, StyleSheet, View } from "react-native";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";

import { APPETIZER_IMAGES } from "@/src/constants/Appetizers-image";
import { BEVERAGE_IMAGES } from "@/src/constants/Beverages-image";
import { ENSALADA_IMAGES } from "@/src/constants/Ensaladas-image";
import { LUNCH_SPECIALS_IMAGES } from "@/src/constants/Lunch-Specials-image";
import { LOCAL_FAVORITES_IMAGES } from "@/src/constants/Local-Favorites-image";
import { HOUSE_SPECIALTIES_IMAGES } from "@/src/constants/House-Specialties-image";
import { AMERICAN_FOOD_IMAGES } from "@/src/constants/American-Food-image";
import { FAJITAS_IMAGES } from "@/src/constants/Fajitas-image";
import { NACHOS_IMAGES } from "@/src/constants/Nachos-image";
import { QUESADILLAS_IMAGES } from "@/src/constants/Quesadillas-image";
import { DESSERT_IMAGES } from "@/src/constants/Dessert-image";
import { KIDS_IMAGES } from "@/src/constants/Kids-image";

import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from "@/src/data/menu";
import { GeckosColors } from "@/src/theme/colors";

/**
 * Central category → image map registry
 * Add new categories here ONLY
 */
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


function ItemRow({
  item,
  categoryId,
}: {
  item: MenuItem;
  categoryId: string;
}) {
  const imageMap = IMAGE_MAP_BY_CATEGORY[categoryId];
  const image = imageMap?.[item.id];

  return (
    <View style={styles.itemRow}>
      {image ? (
        <Image source={image} style={styles.itemImage} resizeMode="cover" />
      ) : imageMap ? (
        <View style={styles.missingImage}>
          <GeckosText style={styles.missingImageText}>
            Missing image:
            {"\n"}
            {item.id}
          </GeckosText>
        </View>
      ) : null}

      <View style={styles.itemContent}>
        <View style={styles.itemTop}>
          <GeckosText style={styles.itemName}>{item.name}</GeckosText>

          {typeof item.price === "number" ? (
            <GeckosText style={styles.itemPrice}>
              ${item.price.toFixed(2)}
            </GeckosText>
          ) : item.priceText ? (
            <GeckosText style={styles.itemPrice}>{item.priceText}</GeckosText>
          ) : null}
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = String(id);

  const categoryTitle =
    MENU_CATEGORIES.find((c) => c.id === categoryId)?.title ?? "Category";

  const items = MENU_ITEMS.filter((m) => m.categoryId === categoryId);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: categoryTitle,
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTitleStyle: {
            color: GeckosColors.geckoGreen,
            fontWeight: "800",
          },
          headerTintColor: GeckosColors.geckoGreen,
          headerShadowVisible: false,
        }}
      />

      <AppContainer noPadding noBottomSafeArea>
        {categoryId === "lunch-specials" && (
          <View style={styles.lunchInfo}>
            <GeckosText variant="muted">
              Served with rice & refried beans.
            </GeckosText>

            <GeckosText style={styles.sectionTitle}>Choose from:</GeckosText>
            <GeckosText variant="muted">
              Cheese Enchilada, Chicken Enchilada, Beef Enchilada, Crispy Taco,
              Bean Tostada, Beef Tostada, Guacamole Tostada, Beef Burrito, Cheese
              Burrito.
            </GeckosText>

            <GeckosText style={styles.sectionTitle}>Sauce Choices:</GeckosText>
            <GeckosText variant="muted">
              Chili, Ranchero, Sour Cream Sauce, Yellow Queso, White Queso (+$0.50)
            </GeckosText>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ItemRow item={item} categoryId={categoryId} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <GeckosText variant="muted" style={styles.empty}>
              No items yet.
            </GeckosText>
          }
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },

  itemRow: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    overflow: "hidden",
  },

  itemImage: {
    width: "100%",
    height: 140,
  },

  missingImage: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F1F1F",
  },

  missingImageText: {
    color: "#F2F3F5",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 12,
  },

  itemContent: {
    padding: 12,
  },

  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: GeckosColors.text,
    flex: 1,
    flexWrap: "wrap",
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.text,
    textAlign: "right",
    maxWidth: 150,
  },

  itemDesc: {
    marginTop: 6,
    lineHeight: 18,
  },

  separator: {
    height: 8,
  },

  empty: {
    marginTop: 16,
    paddingHorizontal: 24,
  },

  lunchInfo: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 12,
    gap: 6,
  },

  sectionTitle: {
    marginTop: 4,
    fontWeight: "700",
    color: GeckosColors.text,
  },
});
