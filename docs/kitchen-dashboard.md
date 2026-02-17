# Kitchen Dashboard

This project now includes a staff kitchen route at `/kitchen`.

## What It Does

- Reads live orders from `public.orders` in Supabase.
- Subscribes to realtime inserts/updates on `orders`.
- Lets staff move order statuses: `new -> accepted -> preparing -> ready -> picked_up`.
- Supports pull-to-refresh and an Active/All toggle.

## Setup

1. In Supabase SQL editor, run:
   - `supabase/kitchen_orders_setup.sql`
2. In Supabase SQL editor, run:
   - `supabase/kitchen_staff_access.sql`
3. In Supabase SQL editor, run:
   - `supabase/kitchen_day_sessions.sql`
4. In Supabase SQL editor, run:
   - `supabase/orders_retention.sql`
5. In Supabase Auth, create staff user account(s) (email/password).
6. Add each staff user to `public.staff_users`:
   - `insert into public.staff_users (user_id) select id from auth.users where email = 'staff@yourrestaurant.com' on conflict (user_id) do nothing;`
7. In Supabase Table Editor, enable Realtime for `public.orders` and `public.kitchen_days`.
8. Start app locally:
   - `npm run web`
9. Open:
   - `http://localhost:19006/kitchen`
10. Sign in with a staff account.

## Production

- Deploy the app web build to hosting and use `/kitchen` as the staff URL.
- This route now requires staff sign-in and `staff_users` membership.
- Day workflow:
  - Open a named day (for example `Feb 16 Dinner`).
  - Close it when service/shift ends.
- Retention workflow:
  - Orders move out of live dashboard after 36 hours (accepted_at or created_at).
  - Archived rows are purged after 7 days.
