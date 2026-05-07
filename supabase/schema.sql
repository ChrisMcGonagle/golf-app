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

-- ============================================================
-- PBI-013: Members table
-- Supports membership renewal search by first_name, last_name,
-- and member_number. Full member fields (address, DOB, phone,
-- etc.) will be added in PBI-015/016/017.
-- ============================================================

create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),
    member_number text not null unique,
    first_name text not null,
    last_name text not null,
    membership_type text not null,
    created_at timestamptz not null default now(),
    constraint members_membership_type_check check (
        membership_type in (
            'Full Member',
            'Senior Member',
            'Student Member',
            'Beginner (Year 1)',
            'Beginner (Year 2)',
            'Juvenile',
            'Country Member',
            'Overseas Life Member',
            'Life Member',
            'Family Member'
        )
    )
);

-- Indexes to support renewal lookup search performance
create index if not exists members_member_number_idx on public.members (member_number);
create index if not exists members_last_name_idx on public.members (last_name);

alter table public.members enable row level security;

-- Deny all access to anon and authenticated roles.
-- All reads/writes are performed server-side via the service role key,
-- which bypasses RLS by design.
revoke all on table public.members from public;
revoke all on table public.members from anon;
revoke all on table public.members from authenticated;

-- ============================================================
-- Members table: full profile field expansion
-- Additive migration — no existing columns removed or renamed.
--
-- PO spec names the PK "membership_id" (user-defined member number,
-- not uuid). The existing `member_number` column already satisfies
-- this contract (text, not null, unique). The internal `id uuid`
-- primary key is retained for FK integrity.
--
-- `dob` is added nullable for migration safety: existing rows have
-- no date-of-birth value. Application-layer validation enforces
-- not-null on new inserts.
-- ============================================================

alter table public.members
    add column if not exists dob              date,
    add column if not exists address_line1    text,
    add column if not exists address_line2    text,
    add column if not exists address_line3    text,
    add column if not exists city             text,
    add column if not exists county           text,
    add column if not exists postal_code      text,
    add column if not exists country          text,
    add column if not exists email            text,
    add column if not exists mobile_phone     text,
    add column if not exists status           text not null default 'pending',
    add column if not exists membership_category text,
    add column if not exists home_club        text,
    add column if not exists secondary_club   text,
    add column if not exists handicap_index   numeric(4,1),
    add column if not exists updated_at       timestamptz default now();

-- Status check constraint (idempotent)
alter table public.members drop constraint if exists members_status_check;
alter table public.members add constraint members_status_check
    check (status in ('active', 'inactive', 'pending'));

-- Compound btree index for case-insensitive name search
create index if not exists members_name_lower_idx
    on public.members (lower(first_name), lower(last_name));

-- membership_id (member_number) index already exists as members_member_number_idx

-- ============================================================
-- PBI-032: Emergency contact and safeguarding fields
-- Additive migration to support shipped Renewal and SOS UI.
-- All columns are nullable for migration safety.
-- renewal_date: member's membership renewal due date
-- emergency_contact_*: contact person for emergencies
-- medical_conditions, allergies, medications: health info for SOS
-- additional_assistance: accessibility/support needs
-- ============================================================

alter table public.members
    add column if not exists renewal_date                date,
    add column if not exists emergency_contact_name      text,
    add column if not exists emergency_contact_relationship text,
    add column if not exists emergency_phone_number      text,
    add column if not exists medical_conditions          text,
    add column if not exists allergies                   text,
    add column if not exists medications                 text,
    add column if not exists additional_assistance       text;

-- ============================================================
-- PBI-029: membership_pending table
-- Stores pending membership application payloads submitted via
-- the membership form. All access is restricted to the service
-- role only — no anon or authenticated user access permitted.
-- Third-party account provisioning status fields (golfireland,
-- brs, clubv1) default to 'pending' and are updated by the
-- server-side provisioning workflow.
-- ============================================================

create table if not exists public.membership_pending (
  id                   uuid        primary key default gen_random_uuid(),
  payload              jsonb       not null,
  golfireland_account  text        not null default 'pending',
  brs_account          text        not null default 'pending',
  clubv1_account       text        not null default 'pending',
  submitted_at         timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

alter table public.membership_pending enable row level security;

-- Deny all access to public, anon, and authenticated roles.
-- Only the service role (which bypasses RLS) may read or write this table.
revoke all on table public.membership_pending from public;
revoke all on table public.membership_pending from anon;
revoke all on table public.membership_pending from authenticated;

-- Explicit service-role full-access policy (belt-and-suspenders).
-- The service role bypasses RLS by default, but this policy documents
-- intent and guards against future RLS flag changes.
drop policy if exists "service role full access" on public.membership_pending;
create policy "service role full access"
  on public.membership_pending
  for all
  to service_role
  using (true)
  with check (true);
