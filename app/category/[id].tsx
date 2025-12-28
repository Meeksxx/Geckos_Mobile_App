import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, Image, StyleSheet, View } from "react-native";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { BEVERAGE_IMAGES } from "@/src/constants/Beverages-image";
import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from "@/src/data/menu";
import { GeckosColors } from "@/src/theme/colors";

function ItemRow({
  item,
  showBeverageImages,
}: {
  item: MenuItem;
  showBeverageImages: boolean;
}) {
  const image = showBeverageImages
    ? BEVERAGE_IMAGES[item.id as keyof typeof BEVERAGE_IMAGES]
    : undefined;

  return (
    <View style={styles.itemRow}>
      {/* Beverage image (or obvious placeholder) */}
      {showBeverageImages ? (
        image ? (
          <Image source={image} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={styles.missingImage}>
            <GeckosText style={styles.missingImageText}>
              
            </GeckosText>
          </View>
        )
      ) : null}

      {/* Main content (ALWAYS visible) */}
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

  const showBeverageImages = categoryId === "beverage";

  const categoryTitle =
    MENU_CATEGORIES.find((c) => c.id === categoryId)?.title ?? "Category";

  const items = MENU_ITEMS.filter((m) => m.categoryId === categoryId);

  return (
    <>
      {/* ✅ Use the native header so we get the Back button */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: categoryTitle,
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTitleStyle: { color: GeckosColors.geckoGreen, fontWeight: "800" },
          headerTintColor: GeckosColors.geckoGreen, // back arrow color
          headerShadowVisible: false,
        }}
      />

      <AppContainer noPadding noBottomSafeArea>
        {/* Lunch Specials info */}
        {categoryId === "lunch-specials" && (
          <View style={styles.lunchInfo}>
            <GeckosText variant="muted">
              Served with rice & refried beans.
            </GeckosText>

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

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ItemRow item={item} showBeverageImages={showBeverageImages} />
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

  // Placeholder view shown when an image is missing
  missingImage: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6E6E6",
  },
  missingImageText: {
    color: "#222",
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
