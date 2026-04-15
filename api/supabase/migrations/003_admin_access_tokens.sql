alter table public.admin_users
add column if not exists access_token text unique,
add column if not exists access_token_created_at timestamptz;
