create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    role text not null,
    avatar_url text,
    pin_hash text,
    pin_fail_count integer not null default 0,
    pin_locked_until timestamptz,
    created_at timestamptz not null default now(),
    constraint profiles_role_check check (role in ('staff', 'admin'))
);

-- Idempotent migration: update role check constraint for existing databases
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('staff', 'admin'));

alter table public.profiles enable row level security;

revoke all on table public.profiles from public;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
