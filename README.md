# Gecko's Mobile App

A full-stack React Native app for **Gecko's at Lake Texoma**, a real restaurant in Gordonville, Oklahoma. Customers use it to browse the menu, place orders, pay, and track their order in real time. Staff manage the kitchen queue through a built-in kitchen view.

Live on **TestFlight** and actively used by real customers.

---

## Features

### Customer
- Browse the full menu by category — items support variants, add-ons, lunch combos, sauces, and special instructions
- Cart with quantity controls and item removal
- Checkout with name, phone, and optional pickup time
- Pay online via Stripe or pay at pickup
- Real-time order status tracking (New → Accepted → Preparing → Ready → Picked Up) with a live progress timeline
- Order history with one-tap reorder
- Rewards points system — earn points per order, redeem for discounts
- Push notifications when order status changes
- Home screen announcements and app specials pulled from the database

### Kitchen (Staff)
- Live incoming order queue powered by Supabase Realtime
- Accept, update, and complete orders
- Issue refunds through Stripe
- Scheduled open/close with manual override
- Daily order history view

### Account
- Sign up / sign in / reset password
- Edit profile (name, phone)
- Points balance and full transaction history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54, New Architecture) |
| Routing | Expo Router (file-based) |
| Language | TypeScript |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| Payments | Stripe (`@stripe/stripe-react-native`) |
| Push Notifications | Expo Notifications |
| Build / Deploy | EAS Build, TestFlight |

---

## Architecture

- **Supabase Auth** handles sign-up, sign-in, and session management
- **Row-level security** ensures customers can only access their own orders and points
- **Supabase Realtime** powers live order status for both customers and the kitchen view
- **Edge Functions** handle all Stripe server-side logic:
  - `create-payment-intent` — creates a PaymentIntent and returns a client secret
  - `refund-payment` — processes refunds from the kitchen view
  - `send-announcement-notification` — sends push notifications to all customers
- **RPCs** handle atomic operations like `redeem_reward` and `is_accepting_orders`

---

## Project Structure

```
app/
  (tabs)/         # Bottom tab screens (Home, Menu, Order, Rewards, Account)
  kitchen.tsx     # Staff kitchen management view
  orders.tsx      # Customer order history
  checkout.tsx    # Stripe payment flow
  item.tsx        # Item detail / add to cart
  auth.tsx        # Sign in / sign up

src/
  context/        # AuthContext, CartContext
  components/     # Shared UI components
  config/         # Rewards config
  hooks/          # useAppStripe
  lib/            # Supabase client
  theme/          # Colors

supabase/
  functions/      # Edge Functions (Stripe, notifications)
```

---

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your own credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```
