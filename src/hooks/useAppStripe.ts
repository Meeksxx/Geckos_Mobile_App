// Web stub — Stripe React Native is not available on web.
// checkout.tsx is never rendered on web so these are never called.
export function useStripe() {
  return {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
  };
}
