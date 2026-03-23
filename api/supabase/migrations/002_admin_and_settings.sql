create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.app_settings (key, value)
values (
  'consultation_types',
  '[
    {"id":"first-visit","value":"first","label":"Primeira vez","mode":"mixed","durationMinutes":90,"price":0,"active":true},
    {"id":"second-visit","value":"checkup","label":"Segunda vez","mode":"presential","durationMinutes":60,"price":0,"active":true},
    {"id":"returning-client","value":"return","label":"Retorno se ja foi cliente","mode":"presential","durationMinutes":60,"price":0,"active":true},
    {"id":"online-return","value":"emergency","label":"Retorno online","mode":"online","durationMinutes":30,"price":0,"active":true}
  ]'::jsonb
)
on conflict (key) do nothing;

insert into public.admin_users (email, full_name, password_hash, is_active)
values (
  'admin@drjefferson.local',
  'Administrador',
  crypt('Admin@123456', gen_salt('bf')),
  true
)
on conflict (email) do nothing;
