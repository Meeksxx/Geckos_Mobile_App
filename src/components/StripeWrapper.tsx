import React from "react";

// Web fallback — Stripe React Native is not supported on web.
export default function StripeWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
