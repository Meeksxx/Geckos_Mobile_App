import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import type { AddOn } from "@/src/data/menu";

export type CartItem = {
  lineKey: string;
  itemId: string;
  name: string;
  variant?: string;
  selectedAddOns?: AddOn[];
  lunchChoices?: string[];
  lunchSauces?: string[];
  specialInstructions?: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  toastName: string | null;
  hideToast: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toastName, setToastName] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.lineKey === newItem.lineKey);
        if (existing) {
          return prev.map((i) =>
            i.lineKey === newItem.lineKey
              ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
              : i
          );
        }
        return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToastName(newItem.name);
      toastTimer.current = setTimeout(() => setToastName(null), 3500);
    },
    []
  );

  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastName(null);
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((i) => i.lineKey !== lineKey));
  }, []);

  const updateQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.lineKey !== lineKey));
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i))
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, toastName, hideToast }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, toastName, hideToast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
