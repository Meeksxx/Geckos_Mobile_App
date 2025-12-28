import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { MENU_CATEGORIES, MenuCategory } from "@/src/data/menu";
import { GeckosColors } from "@/src/theme/colors";
import { router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { CATEGORY_IMAGES } from "@/src/constants/category-images";

function CategoryRow({ item }: { item: MenuCategory }) {
  return (
    <Pressable
      onPress={() => router.push(`/category/${item.id}` as any)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Image
  source={CATEGORY_IMAGES[item.id]}
  style={styles.imageBlock}
  resizeMode="cover"
/>


      <View style={styles.textBlock}>
        <GeckosText style={styles.rowTitle}>
          {item.title.toUpperCase()}
        </GeckosText>
      </View>

      <View style={styles.chevronContainer}>
        <GeckosText style={styles.chevron}>›</GeckosText>
      </View>
    </Pressable>
  );
}

export default function MenuScreen() {
  return (
    <AppContainer noPadding noBottomSafeArea>
      <FlatList
        data={MENU_CATEGORIES}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CategoryRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <GeckosText variant="title" style={styles.pageTitle}>
            Menu
          </GeckosText>
        }
        // iOS: prevent auto inset weirdness
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      />
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 34,
    color: GeckosColors.geckoGreen,
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

  // ✅ key: NO bottom padding so it can sit flush above the tab bar
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 0,
  },

  row: {
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GeckosColors.border,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 92,
  },
  pressed: {
    opacity: 0.9,
  },
  imageBlock: {
    width: 110,
    height: "100%",
    backgroundColor: "#1B241E",
  },
  textBlock: {
    flex: 1,
    paddingHorizontal: 16,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.geckoGreen,
    letterSpacing: 1,
  },
  chevronContainer: {
    paddingHorizontal: 14,
  },
  chevron: {
    fontSize: 34,
    color: GeckosColors.mutedText,
    marginTop: -2,
  },
  separator: {
    height: 12,
  },
});
