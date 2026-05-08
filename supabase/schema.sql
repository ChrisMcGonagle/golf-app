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

-- ============================================================
-- PBI-038: membership_requests table
-- Stores live membership requests submitted via the membership
-- form workflow. `operator_id` is the authenticated staff/admin
-- profile that submitted the request. `requester_name` and
-- `requester_email` are payload-derived display fields.
-- ============================================================

create table if not exists public.membership_requests (
    id                   uuid        primary key default gen_random_uuid(),
    payload              jsonb       not null,
    request_type         text        not null,
    operator_id          uuid        not null references public.profiles(id),
    requester_name       text        not null,
    requester_email      text        not null,
    status               text        not null default 'pending',
    golfireland_account  text        not null default 'pending',
    brs_account          text        not null default 'pending',
    clubv1_account       text        not null default 'pending',
    membership_status    text        not null,
    submitted_at         timestamptz not null default now(),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

alter table public.membership_requests
    add column if not exists payload              jsonb       not null,
    add column if not exists request_type         text        not null,
    add column if not exists operator_id          uuid,
    add column if not exists requester_name       text,
    add column if not exists requester_email      text,
    add column if not exists status               text        not null default 'pending',
    add column if not exists golfireland_account  text        not null default 'pending',
    add column if not exists brs_account          text        not null default 'pending',
    add column if not exists clubv1_account       text        not null default 'pending',
    add column if not exists membership_status    text,
    add column if not exists submitted_at         timestamptz not null default now(),
    add column if not exists created_at           timestamptz not null default now(),
    add column if not exists updated_at           timestamptz not null default now();

alter table public.membership_requests drop constraint if exists membership_requests_operator_id_fkey;
alter table public.membership_requests
    add constraint membership_requests_operator_id_fkey
    foreign key (operator_id) references public.profiles(id);

alter table public.membership_requests drop constraint if exists membership_requests_status_check;
alter table public.membership_requests
    add constraint membership_requests_status_check
    check (status in ('pending', 'in_progress', 'completed'));

alter table public.membership_requests drop constraint if exists membership_requests_golfireland_account_check;
alter table public.membership_requests
    add constraint membership_requests_golfireland_account_check
    check (golfireland_account in ('pending', 'in_progress', 'completed', 'failed'));

alter table public.membership_requests drop constraint if exists membership_requests_brs_account_check;
alter table public.membership_requests
    add constraint membership_requests_brs_account_check
    check (brs_account in ('pending', 'in_progress', 'completed', 'failed'));

alter table public.membership_requests drop constraint if exists membership_requests_clubv1_account_check;
alter table public.membership_requests
    add constraint membership_requests_clubv1_account_check
    check (clubv1_account in ('pending', 'in_progress', 'completed', 'failed'));

alter table public.membership_requests drop constraint if exists membership_requests_membership_status_check;
alter table public.membership_requests
    add constraint membership_requests_membership_status_check
    check (membership_status in ('pending', 'in_progress', 'completed', 'failed'));

comment on column public.membership_requests.payload is 'Full membership form JSON payload.';
comment on column public.membership_requests.operator_id is 'Authenticated staff/admin profile that submitted the request.';
comment on column public.membership_requests.requester_name is 'Requester display name derived from the submitted payload.';
comment on column public.membership_requests.requester_email is 'Requester email derived from the submitted payload.';
comment on column public.membership_requests.membership_status is 'Membership workflow step status derived from the submitted payload/workflow state.';

alter table public.membership_requests enable row level security;

revoke all on table public.membership_requests from public;
revoke all on table public.membership_requests from anon;
revoke all on table public.membership_requests from authenticated;

drop policy if exists "service role full access" on public.membership_requests;
create policy "service role full access"
    on public.membership_requests
    for all
    to service_role
    using (true)
    with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_membership_requests_updated_at on public.membership_requests;
create trigger set_membership_requests_updated_at
    before update on public.membership_requests
    for each row
    execute function public.set_updated_at();

-- ============================================================
-- PBI-040: integration_queue table
-- One-attempt integration queue for downstream manual/terminal
-- processing. Rows are auto-enqueued from membership_requests.
-- Queue statuses are intentionally limited to:
-- pending, processing, completed, failed.
-- ============================================================

create table if not exists public.integration_queue (
    id               uuid        primary key default gen_random_uuid(),
    request_id       uuid        not null references public.membership_requests(id) on delete cascade,
    status           text        not null default 'pending',
    last_error       text,
    last_error_at    timestamptz,
    locked_at        timestamptz,
    locked_by_worker text,
    metadata         jsonb,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    constraint integration_queue_request_id_key unique (request_id),
    constraint integration_queue_status_check check (status in ('pending', 'processing', 'completed', 'failed'))
);

alter table public.integration_queue
    add column if not exists request_id       uuid,
    add column if not exists status           text        not null default 'pending',
    add column if not exists last_error       text,
    add column if not exists last_error_at    timestamptz,
    add column if not exists locked_at        timestamptz,
    add column if not exists locked_by_worker text,
    add column if not exists metadata         jsonb,
    add column if not exists created_at       timestamptz not null default now(),
    add column if not exists updated_at       timestamptz not null default now();

alter table public.integration_queue
    alter column request_id set not null;

alter table public.integration_queue drop constraint if exists integration_queue_request_id_fkey;
alter table public.integration_queue
    add constraint integration_queue_request_id_fkey
    foreign key (request_id) references public.membership_requests(id) on delete cascade;

alter table public.integration_queue drop constraint if exists integration_queue_request_id_key;
alter table public.integration_queue
    add constraint integration_queue_request_id_key unique (request_id);

alter table public.integration_queue drop constraint if exists integration_queue_status_check;
alter table public.integration_queue
    add constraint integration_queue_status_check
    check (status in ('pending', 'processing', 'completed', 'failed'));

create index if not exists integration_queue_status_created_at_idx
    on public.integration_queue (status, created_at);

alter table public.integration_queue enable row level security;

revoke all on table public.integration_queue from public;
revoke all on table public.integration_queue from anon;
revoke all on table public.integration_queue from authenticated;

drop policy if exists "service role full access" on public.integration_queue;
create policy "service role full access"
    on public.integration_queue
    for all
    to service_role
    using (true)
    with check (true);

drop trigger if exists set_integration_queue_updated_at on public.integration_queue;
create trigger set_integration_queue_updated_at
    before update on public.integration_queue
    for each row
    execute function public.set_updated_at();

create or replace function public.enqueue_membership_request_for_integration()
returns trigger
language plpgsql
as $$
begin
    if new.status = 'pending' then
        insert into public.integration_queue (request_id, status)
        values (new.id, 'pending')
        on conflict (request_id) do nothing;
    end if;

    return new;
end;
$$;

drop trigger if exists enqueue_membership_request_for_integration on public.membership_requests;
create trigger enqueue_membership_request_for_integration
    after insert on public.membership_requests
    for each row
    execute function public.enqueue_membership_request_for_integration();

create or replace function public.claim_integration_queue(
    claim_worker_id text,
    claim_batch_size integer default 10
)
returns table (
    id uuid,
    request_id uuid,
    status text,
    last_error text,
    last_error_at timestamptz,
    locked_at timestamptz,
    locked_by_worker text,
    metadata jsonb,
    created_at timestamptz,
    updated_at timestamptz,
    request_type text,
    payload jsonb
)
language plpgsql
as $$
begin
    if claim_worker_id is null or btrim(claim_worker_id) = '' then
        raise exception 'claim_worker_id is required';
    end if;

    if coalesce(claim_batch_size, 0) <= 0 then
        return;
    end if;

    return query
    with locked_rows as (
        select iq.id
        from public.integration_queue iq
        where iq.status = 'pending'
        order by iq.created_at, iq.id
        for update skip locked
        limit claim_batch_size
    ),
    claimed_rows as (
        update public.integration_queue iq
        set status = 'processing',
            locked_at = now(),
            locked_by_worker = claim_worker_id,
            updated_at = now()
        from locked_rows
        where iq.id = locked_rows.id
        returning
            iq.id,
            iq.request_id,
            iq.status,
            iq.last_error,
            iq.last_error_at,
            iq.locked_at,
            iq.locked_by_worker,
            iq.metadata,
            iq.created_at,
            iq.updated_at
    )
    select
        claimed_rows.id,
        claimed_rows.request_id,
        claimed_rows.status,
        claimed_rows.last_error,
        claimed_rows.last_error_at,
        claimed_rows.locked_at,
        claimed_rows.locked_by_worker,
        claimed_rows.metadata,
        claimed_rows.created_at,
        claimed_rows.updated_at,
        membership_requests.request_type,
        membership_requests.payload
    from claimed_rows
    join public.membership_requests
        on membership_requests.id = claimed_rows.request_id
    order by claimed_rows.created_at, claimed_rows.id;
end;
$$;

revoke all on function public.claim_integration_queue(text, integer) from public;
revoke all on function public.claim_integration_queue(text, integer) from anon;
revoke all on function public.claim_integration_queue(text, integer) from authenticated;
grant execute on function public.claim_integration_queue(text, integer) to service_role;
