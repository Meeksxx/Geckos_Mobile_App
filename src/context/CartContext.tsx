import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { AddOn } from "@/src/data/menu";

export type CartItem = {
  lineKey: string;
  itemId: string;
  name: string;
  variant?: string;
  selectedAddOns?: AddOn[];
  lunchChoices?: string[];
  lunchSauce?: string;
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
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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
    },
    []
  );

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
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }),
    [items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
