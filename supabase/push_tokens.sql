-- push_tokens table
-- Stores Expo push tokens so staff can send notifications to all app users.
-- Tokens are device-level; user_id is linked when the user is signed in.

create table if not exists push_tokens (
  id         uuid        primary key default gen_random_uuid(),
  token      text        not null unique,
  user_id    uuid        references auth.users(id) on delete set null,
  platform   text,
  created_at timestamptz default now()
);

alter table push_tokens enable row level security;

-- Any app user (even anonymous) can register their device token.
create policy "Anyone can insert a push token"
  on push_tokens for insert
  with check (true);

-- Allow upsert updates (e.g. linking user_id after sign-in).
create policy "Anyone can update a push token"
  on push_tokens for update
  using (true)
  with check (true);

-- Only staff can read all tokens (needed by the edge function via service role).
-- The edge function uses the service role key, so this policy is for direct queries.
create policy "Staff can read push tokens"
  on push_tokens for select
  using (
    exists (select 1 from staff_users where user_id = auth.uid())
  );
