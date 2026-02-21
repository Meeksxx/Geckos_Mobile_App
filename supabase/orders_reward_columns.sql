-- Add reward tracking columns to orders table.
-- Run this once in the Supabase SQL editor before deploying the rewards redemption feature.

alter table public.orders
  add column if not exists reward_label    text,
  add column if not exists reward_discount numeric(10, 2);
