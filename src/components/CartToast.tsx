import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/src/context/CartContext";
import { GeckosText } from "@/src/components/GeckosText";
import { GeckosColors } from "@/src/theme/colors";

export function CartToast() {
  const { toastName, hideToast } = useCart();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastName) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toastName]);

  const handleViewOrder = () => {
    hideToast();
    router.push("/(tabs)/order");
  };

  return (
    <Animated.View
      pointerEvents={toastName ? "auto" : "none"}
      style={[
        styles.container,
        { bottom: insets.bottom + 60 },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.inner}>
        <Ionicons name="checkmark-circle" size={20} color={GeckosColors.geckoGreen} />
        <GeckosText style={styles.text} numberOfLines={1}>
          {toastName} added to cart
        </GeckosText>
        <Pressable
          onPress={handleViewOrder}
          style={({ pressed }) => [styles.viewBtn, pressed && { opacity: 0.75 }]}
        >
          <GeckosText style={styles.viewBtnText}>View Order</GeckosText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GeckosColors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 1,
    borderColor: GeckosColors.border,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: GeckosColors.text,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GeckosColors.geckoGreen,
    borderRadius: 20,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
  },
});
