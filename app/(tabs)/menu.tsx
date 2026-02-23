import { AppContainer } from "@/src/components/AppContainer";
import { GeckosText } from "@/src/components/GeckosText";
import type { MenuCategory } from "@/src/data/menu";
import { useMenu } from "@/src/context/MenuContext";
import { GeckosColors } from "@/src/theme/colors";
import { Stack, router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_IMAGES } from "@/src/constants/category-images";

const HEADER_BAR_HEIGHT = 48; // ✅ pinch amount (56–60 sweet spot)

function CategoryRow({ item }: { item: MenuCategory }) {
  // Remote URL from dashboard upload takes priority; fall back to bundled asset
  const remoteUri = item.imageUrl ?? null;
  const localAsset = (CATEGORY_IMAGES as Record<string, any>)[item.id];
  const imageSource = remoteUri ? { uri: remoteUri } : localAsset;

  return (
    <Pressable
      onPress={() => router.push(`/category/${item.id}` as any)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.imageBlock}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imageBlock, styles.imagePlaceholder]} />
      )}

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
  const insets = useSafeAreaInsets();
  const headerBgHeight = insets.top + HEADER_BAR_HEIGHT;
  const { categories } = useMenu();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitleAlign: "center",
          headerShadowVisible: false,

          // ✅ typed-safe “pinch”: transparent header + custom background
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerBackground: () => (
            <View style={[styles.headerBg, { height: headerBgHeight }]} />
          ),

          // ✅ logo stays same
          headerTitle: () => (
            <View style={styles.headerTitleWrap}>
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
          data={categories}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CategoryRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}

          // ✅ push content below our custom header bg
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerBgHeight - 75 }, // keep your “lift” behavior
          ]}

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
  headerBg: {
    backgroundColor: GeckosColors.background,
    borderBottomWidth: 1,
    borderBottomColor: GeckosColors.background,
  },

  headerTitleWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 1, // ✅ keep same “lower the logo a hair” value
  },

  headerLogo: {
    height: 28,
    width: 150,
  },

  pageTitle: {
    fontSize: 34,
    color: GeckosColors.text,
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingTop: 15,
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
  imagePlaceholder: {
    backgroundColor: "#1F2920",
  },

  textBlock: {
    flex: 1,
    paddingHorizontal: 16,
  },

  rowTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GeckosColors.text,
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
