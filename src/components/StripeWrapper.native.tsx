import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export default function StripeWrapper({ children }: { children: React.ReactElement }) {
  return (
    <StripeProvider
      publishableKey={STRIPE_PK}
      merchantIdentifier="merchant.com.zacmeeks.geckos"
    >
      {children}
    </StripeProvider>
  );
}
