import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { supabase } from "@/src/lib/supabase";
import {
  LUNCH_CHOICES as STATIC_LUNCH_CHOICES,
  LUNCH_SAUCES as STATIC_LUNCH_SAUCES,
  MENU_CATEGORIES as STATIC_CATEGORIES,
  MENU_ITEMS as STATIC_ITEMS,
  type AddOn,
  type MenuCategory,
  type MenuItem,
} from "@/src/data/menu";

/* ─── Types ──────────────────────────────────────────────── */

type MenuContextValue = {
  categories: MenuCategory[];
  items: MenuItem[];
  lunchChoices: string[];
  lunchSauces: AddOn[];
  isLoading: boolean;
  isUsingFallback: boolean;
  refetch: () => Promise<void>;
};

/* ─── Context ────────────────────────────────────────────── */

const MenuContext = createContext<MenuContextValue | null>(null);

/* ─── Mapping helpers ────────────────────────────────────── */

function mapRemote(data: {
  categories: any[];
  items: any[];
  lunchChoices: any[];
  lunchSauces: any[];
}): {
  categories: MenuCategory[];
  items: MenuItem[];
  lunchChoices: string[];
  lunchSauces: AddOn[];
} {
  const categories: MenuCategory[] = data.categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ id: c.id as MenuCategory["id"], title: c.title, imageUrl: c.image_url ?? undefined }));

  const items: MenuItem[] = data.items
    .filter((i) => i.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      categoryId: i.category_id as MenuItem["categoryId"],
      name: i.name,
      description: i.description ?? undefined,
      price: i.price != null ? Number(i.price) : undefined,
      priceText: i.price_text ?? undefined,
      choiceCount: i.choice_count > 0 ? i.choice_count : undefined,
      imageUrl: i.image_url ?? undefined,
      addOns:
        Array.isArray(i.menu_item_addons) && i.menu_item_addons.length > 0
          ? i.menu_item_addons
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((a: any) => ({ name: a.name, price: Number(a.price) }))
          : undefined,
    }));

  const lunchChoices: string[] = data.lunchChoices
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => c.name);

  const lunchSauces: AddOn[] = data.lunchSauces
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ name: s.name, price: Number(s.price) }));

  return { categories, items, lunchChoices, lunchSauces };
}

/* ─── Fetch ──────────────────────────────────────────────── */

async function fetchMenu() {
  const [catRes, itemRes, choiceRes, sauceRes] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, title, sort_order, is_active, image_url")
      .order("sort_order"),

    supabase
      .from("menu_items")
      .select(`
        id, category_id, name, description, price, price_text,
        choice_count, sort_order, is_active, image_url,
        menu_item_addons ( id, name, price, sort_order )
      `)
      .order("sort_order"),

    supabase
      .from("lunch_choices")
      .select("name, sort_order")
      .order("sort_order"),

    supabase
      .from("lunch_sauces")
      .select("name, price, sort_order")
      .order("sort_order"),
  ]);

  if (catRes.error) throw catRes.error;
  if (itemRes.error) throw itemRes.error;
  if (choiceRes.error) throw choiceRes.error;
  if (sauceRes.error) throw sauceRes.error;

  return {
    categories: catRes.data ?? [],
    items: itemRes.data ?? [],
    lunchChoices: choiceRes.data ?? [],
    lunchSauces: sauceRes.data ?? [],
  };
}

/* ─── Provider ───────────────────────────────────────────── */

export function MenuProvider({ children }: { children: React.ReactNode }) {
  // Initialise with static data so the UI is never blank
  const [categories, setCategories] = useState<MenuCategory[]>(STATIC_CATEGORIES);
  const [items, setItems] = useState<MenuItem[]>(STATIC_ITEMS);
  const [lunchChoices, setLunchChoices] = useState<string[]>(STATIC_LUNCH_CHOICES);
  const [lunchSauces, setLunchSauces] = useState<AddOn[]>(STATIC_LUNCH_SAUCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const remote = await fetchMenu();
      if (remote.categories.length > 0) {
        const mapped = mapRemote(remote);
        setCategories(mapped.categories);
        setItems(mapped.items);
        setLunchChoices(mapped.lunchChoices);
        setLunchSauces(mapped.lunchSauces);
        setIsUsingFallback(false);
      }
    } catch {
      // Network unavailable or Supabase error — keep static data
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Refetch whenever the app comes back to the foreground so menu changes
  // made in the dashboard are visible immediately without restarting the app.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          loadMenu();
        }
      }
    );
    return () => subscription.remove();
  }, [loadMenu]);

  const value = useMemo<MenuContextValue>(
    () => ({
      categories,
      items,
      lunchChoices,
      lunchSauces,
      isLoading,
      isUsingFallback,
      refetch: loadMenu,
    }),
    [categories, items, lunchChoices, lunchSauces, isLoading, isUsingFallback, loadMenu]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/* ─── Hook ───────────────────────────────────────────────── */

export function useMenu(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used inside <MenuProvider>");
  return ctx;
}
