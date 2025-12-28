import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";

import { AppContainer } from "@/src/components/AppContainer";
import { GeckosColors } from "@/src/theme/colors";
import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from "@/src/data/menu";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosHeader } from "@/src/components/GeckosHeader";

function ItemRow({ item }: { item: MenuItem }) {
  return (
    <View style={styles.itemRow}>
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
      <Stack.Screen options={{ headerShown: false }} />

      <AppContainer noPadding noBottomSafeArea>
        <GeckosHeader title={categoryTitle} showBack />


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
              Chili, Ranchero, Sour Cream Sauce, Yellow Queso, White Queso (+$0.50)
            </GeckosText>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <ItemRow item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingBottom: 20,
  },

  itemRow: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
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

  lunchInfo: {
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 6,
  },

  sectionTitle: {
    marginTop: 4,
    fontWeight: "700",
    color: GeckosColors.text,
  },
});
