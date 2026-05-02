-- =============================================================================
-- SEED SCRIPT: Test Staff Profile for PIN Entry Testing (PBI-003b)
-- Purpose : Manual one-time seed for PIN entry verification in Supabase SQL editor
-- NOT a migration — do NOT commit as a migration file
-- Run as: Service Role (bypasses RLS)
--
-- PIN is 1234 for this test account
-- Bcrypt hash: $2b$10$TkxZq2vkL8.X8wCb6VVfPehLnPl8DZQn3cW0yJ9qL9V4dUqDJv8Pm
--
-- NOTE: Written as plain SQL only — no DO $$ / plpgsql blocks.
--       The Supabase SQL editor injects comment metadata inside DO $$ blocks
--       which causes "unterminated dollar-quoted string" errors at runtime.
--
-- Fixed UUID:
--   PIN-ready user : '00000000-0000-0000-0000-000000000003'
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Insert auth user for the PIN-READY staff member
--         This user represents a staff member with a configured PIN ready for
--         entry testing. No lock active, clean slate for failed attempts.
-- -----------------------------------------------------------------------------
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
  '00000000-0000-0000-0000-000000000003',
  'test.pin.ready@golfapp.local',
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

-- -----------------------------------------------------------------------------
-- STEP 2: Insert profile for the PIN-READY staff member
--         pin_hash = bcrypt hash of "1234"  → ready for PIN entry testing
--         pin_locked_until = NULL  → no lock active
--         pin_fail_count   = 0    → clean slate
-- -----------------------------------------------------------------------------
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
  '00000000-0000-0000-0000-000000000003',
  'Test Staff (PIN Ready)',
  'staff',
  NULL,
  '$2b$10$TkxZq2vkL8.X8wCb6VVfPehLnPl8DZQn3cW0yJ9qL9V4dUqDJv8Pm',  -- PIN: 1234
  NULL,                           -- not locked
  0,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 3: Verify — all three test rows should appear in the result set
--         (if run after seed_test_staff.sql)
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
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
ORDER BY p.display_name;
