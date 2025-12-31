import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import { MENU_CATEGORIES, MenuCategory } from "@/src/data/menu";
import { GeckosColors } from "@/src/theme/colors";
import { Stack, router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { CATEGORY_IMAGES } from "@/src/constants/category-images";

function CategoryRow({ item }: { item: MenuCategory }) {
  return (
    <Pressable
      onPress={() => router.push(`/category/${item.id}` as any)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Image source={CATEGORY_IMAGES[item.id]} style={styles.imageBlock} resizeMode="cover" />

      <View style={styles.textBlock}>
        <GeckosText style={styles.rowTitle}>{item.title.toUpperCase()}</GeckosText>
      </View>

      <View style={styles.chevronContainer}>
        <GeckosText style={styles.chevron}>›</GeckosText>
      </View>
    </Pressable>
  );
}

export default function MenuScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: GeckosColors.background },
          headerTitle: () => (
            <Image
              source={require("../../assets/images/logo/Geckos_full_logo_nobackgroundfinal.png")}

              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

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
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
        />
      </AppContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    height: 28,
    width: 150,
  },

  pageTitle: {
    fontSize: 34,
    color: GeckosColors.text, // ✅ accent-only
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },

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

    // Slightly raised feel (subtle)
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.92,
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
    color: GeckosColors.text, // ✅ accent-only
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
