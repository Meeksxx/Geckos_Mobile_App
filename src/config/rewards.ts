import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type RewardConfig = {
  id: string;
  points: number;
  label: string;
  icon: IoniconName;
  description: string;
  /** Discount applied to the order subtotal, in cents */
  discountCents: number;
};

export const REWARDS: RewardConfig[] = [
  {
    id: "queso_sopapilla",
    points: 250,
    label: "Free Queso or Sopapilla",
    icon: "fast-food",
    description: "Enjoy a free queso or sopapilla on us!",
    discountCents: 549,
  },
  {
    id: "appetizer",
    points: 500,
    label: "Free Appetizer",
    icon: "restaurant",
    description: "Any appetizer — on the house.",
    discountCents: 899,
  },
  {
    id: "entree",
    points: 1000,
    label: "Free Entrée or Special",
    icon: "star",
    description: "Pick any entrée or daily special, free!",
    discountCents: 1499,
  },
  {
    id: "fajitas",
    points: 2000,
    label: "Fajitas for 2",
    icon: "flame",
    description: "A full fajitas for two dinner, on us!",
    discountCents: 2999,
  },
];
