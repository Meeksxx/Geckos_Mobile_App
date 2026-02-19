-- Add payment tracking columns to the orders table
-- Run in Supabase SQL editor

alter table public.orders
  add column if not exists payment_method text not null default 'pay_at_restaurant'
    check (payment_method in ('stripe', 'pay_at_restaurant')),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  add column if not exists stripe_payment_intent_id text unique,
  add column if not exists platform_fee_cents integer;

create index if not exists idx_orders_stripe_pi
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
