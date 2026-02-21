# Customer Authentication & Profiles

## Context
The app currently lets anyone place an order by entering a name and phone number at checkout — no account required. This is vulnerable to fake/spam orders and means customers re-enter their info every time. Adding customer accounts protects the ordering system, enables future features (rewards, order history), and saves customer info between sessions.

**Data safety:** The existing retention policy (`orders_retention.sql`) only deletes from `orders` and `orders_archive` tables. Customer profiles live in a separate `customer_profiles` table and `auth.users` — completely unaffected by cleanup.

---

## Step 1: Database — Customer Profiles Table
**New file: `supabase/customer_profiles.sql`**

```sql
create table public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
```

- RLS: users can select/update their own row, insert their own row
- Add `user_id` column to `orders` table so orders are linked to accounts
- Update orders insert policy: require `auth.uid()` (authenticated users only)
- Customers can also select their own orders (for future order history)

Run this SQL in Supabase SQL Editor.

---

## Step 2: Auth Context
**New file: `src/context/AuthContext.tsx`**

Provides app-wide auth state:
- `session` — current Supabase session (or null)
- `profile` — customer profile (display_name, phone) from `customer_profiles`
- `isLoggedIn` — boolean
- `signUp(email, password, name, phone)` — creates account + profile row
- `signIn(email, password)` — logs in, fetches profile
- `signOut()` — logs out, clears state
- `updateProfile(name, phone)` — updates profile row

Listens to `supabase.auth.onAuthStateChange` to stay in sync.

---

## Step 3: Wrap App in AuthProvider
**Modify: `app/_layout.tsx`**

- Import `AuthProvider` from `@/src/context/AuthContext`
- Wrap `<CartProvider>` with `<AuthProvider>` (auth is outer, cart is inner)

---

## Step 4: Auth Screen
**New file: `app/auth.tsx`**

Simple sign-in / sign-up screen with two tabs/modes:
- **Sign In:** email + password → sign in
- **Sign Up:** name, phone, email, password → create account + profile

Styled to match existing dark theme (GeckosColors). Presented as a modal route.

---

## Step 5: Update Order Flow — Require Auth
**Modify: `app/(tabs)/order.tsx`**

- Import `useAuth` from AuthContext
- If not logged in and cart has items: show "Sign in to place your order" with button → navigates to `/auth`
- If logged in: pre-fill customer name and phone from profile (still editable)
- On order submit: include `user_id: session.user.id` in the insert
- Remove requirement to type name/phone every time (pulled from profile)

---

## Step 6: Profile Access from Tab Bar
**Modify: `app/(tabs)/_layout.tsx`**

- Add a small profile icon/button in the header or as a settings option
- When tapped: if logged in, show name + sign out option; if not, navigate to `/auth`

---

## Step 7: Update Orders RLS Policy
**Included in `supabase/customer_profiles.sql`**

- Orders insert policy: change from `with check (true)` to `with check (auth.uid() is not null)` — must be logged in
- Add policy: customers can select their own orders (`user_id = auth.uid()`)
- Staff policies remain unchanged

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/customer_profiles.sql` | Profiles table + updated orders RLS |
| Create | `src/context/AuthContext.tsx` | Auth state management |
| Create | `app/auth.tsx` | Sign in / sign up screen |
| Modify | `app/_layout.tsx` | Wrap in AuthProvider |
| Modify | `app/(tabs)/order.tsx` | Require auth, pre-fill from profile |
| Modify | `app/(tabs)/_layout.tsx` | Profile/account access |

---

## Verification
1. Open app → browse menu freely (no auth required)
2. Add items to cart → go to Order tab → prompted to sign in
3. Create account (sign up) → profile saved → returned to order tab
4. Name and phone pre-filled from profile
5. Place order → check Supabase: order has `user_id` column populated
6. Close and reopen app → still logged in (session persisted)
7. Kitchen dashboard unaffected — staff auth still works independently
8. Run `archive_and_purge_orders()` → customer_profiles table untouched
