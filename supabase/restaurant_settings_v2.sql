-- Add manual_override column to restaurant_settings
-- Run this in the Supabase SQL Editor
alter table restaurant_settings
  add column if not exists manual_override boolean not null default false;
