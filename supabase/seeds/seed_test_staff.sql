-- =============================================================================
-- SEED SCRIPT: Test Staff Profiles
-- Purpose : Manual one-time seed for preview/verification in Supabase SQL editor
-- NOT a migration — do NOT commit as a migration file
-- Run as: Service Role (bypasses RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Reserve deterministic UUIDs for the two test users
--         Using fixed UUIDs so the script is idempotent on repeat runs.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_unlocked_id uuid := '00000000-0000-0000-0000-000000000001';
  v_locked_id   uuid := '00000000-0000-0000-0000-000000000002';
BEGIN

  -- ---------------------------------------------------------------------------
  -- STEP 2a: Insert auth user for the UNLOCKED staff member (no PIN set)
  --          This user represents the /setup-pin navigation path:
  --          they exist in profiles but have never configured a PIN.
  -- ---------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  VALUES (
    v_unlocked_id,
    'test.unlocked@golfapp.local',
    '',                              -- no password; auth handled by service role
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- STEP 2b: Insert auth user for the LOCKED staff member
  --          This user represents a PIN-locked account:
  --          pin_locked_until is set to a future timestamp to trigger the
  --          Locked badge in the UI.
  -- ---------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  VALUES (
    v_locked_id,
    'test.locked@golfapp.local',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- STEP 3a: Insert profile for the UNLOCKED staff member
  --          pin_hash = NULL  → app treats this as "PIN not yet configured"
  --          pin_locked_until = NULL  → no lock active
  --          pin_fail_count   = 0    → clean slate
  -- ---------------------------------------------------------------------------
  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    avatar_url,
    pin_hash,
    pin_locked_until,
    pin_fail_count,
    created_at
  )
  VALUES (
    v_unlocked_id,
    'Test Staff (No PIN)',
    'staff',
    NULL,
    NULL,      -- no PIN set; triggers /setup-pin path
    NULL,      -- not locked
    0,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------------------
  -- STEP 3b: Insert profile for the LOCKED staff member
  --          pin_hash is a placeholder bcrypt-style string (not a real hash)
  --            — replace with a real hash if PIN entry needs to be tested
  --          pin_locked_until = 1 hour from now  → Locked badge visible in UI
  --          pin_fail_count   = 5  → reflects max failed attempts state
  -- ---------------------------------------------------------------------------
  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    avatar_url,
    pin_hash,
    pin_locked_until,
    pin_fail_count,
    created_at
  )
  VALUES (
    v_locked_id,
    'Test Staff (Locked)',
    'staff',
    NULL,
    '$2b$10$placeholderHashForTestingOnlyXXXXXXXXXXXXXXXXXXXXXXXX',
    now() + interval '1 hour',   -- locked for the next hour
    5,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

END $$;

-- =============================================================================
-- STEP 4: Verify — both rows should appear in the result set
-- =============================================================================
SELECT
  p.id,
  p.display_name,
  p.role,
  p.pin_hash IS NOT NULL                           AS has_pin,
  p.pin_locked_until,
  p.pin_locked_until > now()                       AS is_locked,
  p.pin_fail_count,
  p.created_at
FROM public.profiles p
WHERE p.id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
ORDER BY p.display_name;
