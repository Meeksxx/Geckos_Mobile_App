// Web stub: Stripe React Native is not available on web.
// checkout.tsx is never rendered on web so these are never called.
type StripeError = {
  code?: string;
  message: string;
};

type InitPaymentSheetParams = Record<string, unknown>;

export function useStripe() {
  return {
    initPaymentSheet: async (
      _params?: InitPaymentSheetParams
    ): Promise<{ error: StripeError | null }> => ({ error: null }),
    presentPaymentSheet: async (): Promise<{ error: StripeError | null }> => ({
      error: null,
    }),
  };
}
