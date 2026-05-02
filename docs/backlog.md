# Product Backlog — Golf Club Management App (Phase 1 MVP)

_Managed by Planner. Executed by Coder. Source of truth: /docs/SAB.md_

## Status Model

Use these statuses to keep backlog state aligned with branch, PR, and deployment flow.

- READY: The PBI is clarified, unblocked, and ready to start. No implementation branch is required yet.
- IN_PROGRESS: A dedicated branch exists for the PBI and implementation is underway on that branch.
- DEV_DONE: Implementation for the PBI is complete on its branch and a PR to main is ready to open or has just been opened.
- TESTING: A PR from the PBI branch to main is open. Review, fixes, and validation continue on the same branch, and the PR should have a Vercel preview deployment.
- DONE: The PR to main is merged and required tests have passed. Production deployment happens from main only after merge.

---

## PBI-001: Project Scaffold

- **Status:** DEV_DONE
- **Goal:** Initialise the Next.js 14 (App Router) project with TypeScript strict mode, Tailwind CSS, and the Supabase SSR client configured.
- **Scope:**
  - `create-next-app` with App Router and TypeScript
  - Enable `"strict": true` in `tsconfig.json`
  - Configure path alias `@/` in `tsconfig.json`
  - Install and configure Tailwind CSS (v3)
  - Install `@supabase/ssr` and `@supabase/supabase-js`
  - Install `bcrypt` and `@types/bcrypt`
  - Install `iron-session` for signed cookie management
  - Create `lib/supabase/server.ts` (service role client helper) and `lib/supabase/client.ts` (browser client helper)
  - Add `.env.local.example` with all four required env var keys (no values)
  - Add `.env.local` to `.gitignore`
  - Install and configure ESLint (Next.js config) and Prettier
- **Out of Scope:** Any pages, auth logic, DB schema, or business logic
- **Acceptance Criteria:**
  - `npm run dev` starts without errors
  - `npm run build` succeeds with no TypeScript errors
  - Tailwind utility classes render correctly on the default root page
  - Supabase client helpers exist and export typed clients
  - `bcrypt` and `iron-session` are installed
  - ESLint reports zero errors on the scaffold
- **Dependencies:** None
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-002: Supabase Schema — Profiles Table + RLS

- **Status:** READY
- **Goal:** Create the `public.profiles` table with role, PIN hash, lockout tracking columns, and Row Level Security policies that enforce access rules at the database level.
- **Scope:**
  - Migration SQL written to `/supabase/schema.sql`
  - `profiles` table columns:
    - `id` (uuid, PK, FK → auth.users ON DELETE CASCADE)
    - `display_name` (text, not null)
    - `role` (text, CHECK IN ('member','staff'), not null)
    - `avatar_url` (text, nullable)
    - `pin_hash` (text, nullable — null means PIN not yet set)
    - `pin_fail_count` (int, not null, default 0)
    - `pin_locked_until` (timestamptz, nullable — null means not locked)
    - `created_at` (timestamptz, default now())
  - RLS enabled on `profiles`
  - RLS policy: SELECT — service role bypasses RLS; anon key cannot read any rows
  - RLS policy: no INSERT/UPDATE/DELETE via client (all mutations handled server-side with service role key)
- **Out of Scope:** Seed data, profile creation UI, any other tables
- **Acceptance Criteria:**
  - Schema applied to Supabase project without errors
  - `pin_hash` column exists, accepts text, and allows null
  - `pin_fail_count` column exists, is int, defaults to 0, and is not null
  - `pin_locked_until` column exists, is timestamptz, and allows null
  - No direct client INSERT/UPDATE/DELETE is possible via anon or user key
  - Schema is fully captured in `/supabase/schema.sql`
- **Dependencies:** PBI-001
- **Systems Affected:** supabase
- **Risk Level:** High (RLS misconfiguration = data exposure)
- **Estimated Effort:** M
- **Note:** Supabase Specialist Required

---

## PBI-003: Device User Selection Screen

- **Status:** IN_PROGRESS
- **Goal:** Implement the `/select-user` route — a server-rendered grid of staff profile cards that allows a staff member to identify themselves before PIN entry.
- **Scope:**
  - `/app/select-user/page.tsx` — Server Component
  - Fetch all profiles where `role = 'staff'` server-side using `SUPABASE_SERVICE_ROLE_KEY` (no Supabase session required)
  - Display each profile as a card: `display_name` + `avatar_url` (fallback to initials if null)
  - Cards for profiles where `pin_locked_until` is in the future display a "Locked" badge and are non-interactive
  - Unlocked cards with `pin_hash` set navigate to `/pin?userId=<profileId>` on tap
  - Unlocked cards with `pin_hash = null` navigate to `/setup-pin?userId=<profileId>` on tap
  - Error message display (`?error=locked` query param renders a visible lockout notice)
  - No `activeUser` cookie or Supabase session required to render this page
- **Out of Scope:** Member role cards, pagination, search, profile editing, admin flows
- **Acceptance Criteria:**
  - Page renders without any active user session or cookie
  - All staff profiles are shown, fetched server-side via service role
  - Locked profiles show a "Locked" badge and cannot be tapped
  - Unlocked profiles without a PIN set navigate to `/setup-pin?userId=<profileId>`
  - Unlocked profiles with a PIN set navigate to `/pin?userId=<profileId>`
  - `?error=locked` query param renders a visible error message
- **Dependencies:** PBI-001, PBI-002
- **Systems Affected:** frontend, backend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-003b: PIN Entry + Validation

- **Status:** READY
- **Goal:** Implement the `/pin` route where a staff member enters their 4-digit PIN, validated server-side via bcrypt, resulting in a signed `activeUser` cookie on success or lockout on repeated failure.
- **Scope:**
  - `/app/pin/page.tsx` — receives `userId` query param
  - Server-side guard: if the profile for `userId` has `pin_locked_until` in the future → redirect to `/select-user?error=locked`
  - Server-side guard: if `pin_hash = null` for `userId` → redirect to `/setup-pin?userId=<profileId>`
  - 4-digit PIN entry UI (numeric digit boxes)
  - On submit: Server Action receives `profileId` + `pin`
  - Server Action fetches `profiles` row via `SUPABASE_SERVICE_ROLE_KEY`
  - `bcrypt.compare(pin, pin_hash)` server-side
  - **Success:** reset `pin_fail_count = 0` → set signed `activeUser` cookie (`{ profileId, displayName, role, expiresAt: now+8h }`) signed with `ACTIVE_USER_SECRET` → redirect to `/staff`
  - **Failure:** increment `pin_fail_count`. If `>= 5`: set `pin_locked_until = now() + 15 minutes`, reset `pin_fail_count = 0` → redirect to `/select-user?error=locked`. Otherwise: return failure error with remaining attempts count
  - Raw PIN is never logged, stored, or returned
- **Out of Scope:** Password reset, email-based recovery, member PIN, PIN change flow
- **Acceptance Criteria:**
  - Navigating to `/pin?userId=<lockedProfileId>` redirects to `/select-user?error=locked`
  - Navigating to `/pin?userId=<noPinProfileId>` redirects to `/setup-pin?userId=<profileId>`
  - Correct PIN sets a signed `httpOnly` `activeUser` cookie and redirects to `/staff`
  - Incorrect PIN increments `pin_fail_count` in the DB
  - After 5 incorrect PINs, `pin_locked_until` is set ~15 minutes in the future and redirect goes to `/select-user?error=locked`
  - `pin_fail_count` resets to 0 on successful PIN entry
  - Raw PIN never appears in server logs, response body, or client state
  - `bcrypt.compare()` runs server-side only
- **Dependencies:** PBI-001, PBI-002, PBI-003
- **Systems Affected:** frontend, backend
- **Risk Level:** High (authentication boundary; lockout logic must be DB-authoritative)
- **Estimated Effort:** M

---

## PBI-003c: First-Time PIN Setup

- **Status:** READY
- **Goal:** Implement the `/setup-pin` route for staff whose `pin_hash` is null — requiring one-time email + password verification before allowing them to set their PIN.
- **Scope:**
  - `/app/setup-pin/page.tsx` — receives `userId` query param
  - Server-side guard: if `pin_hash` is already set for `userId` → redirect to `/pin?userId=<profileId>`
  - Step 1: email + password fields (identity verification)
  - Server Action: call `supabase.auth.signInWithPassword({ email, password })` server-side
  - Verify authenticated user's email matches the profile record email for `userId` — mismatch → error
  - Step 2 (after verified): 4-digit PIN entry + confirmation
  - Server Action: validate PIN is exactly 4 numeric digits and both fields match
  - On valid PIN: `bcrypt.hash(pin, 10)` → save to `profiles.pin_hash` via service role
  - Set signed `activeUser` cookie → redirect to `/staff`
  - On mismatch or invalid format: inline error, do not write to DB
  - Raw PIN never logged or returned
- **Out of Scope:** PIN change after setup, forgot-PIN flow, admin-initiated PIN reset, member role PIN setup
- **Acceptance Criteria:**
  - Navigating to `/setup-pin?userId=<profileId>` where `pin_hash` is already set redirects to `/pin?userId=<profileId>`
  - Mismatched email/password shows an error and does not proceed
  - Email not matching the profile record shows an error and does not proceed
  - Mismatched or non-4-digit PIN shows an error and does not write to DB
  - On success, `profiles.pin_hash` contains a valid bcrypt hash
  - On success, signed `activeUser` cookie is set and user is redirected to `/staff`
  - Raw PIN never in logs or response body
- **Dependencies:** PBI-001, PBI-002, PBI-003
- **Systems Affected:** frontend, backend, supabase
- **Risk Level:** High (PIN storage must be hashed; identity verification must match profile record)
- **Estimated Effort:** M

---

## PBI-003d: Inactivity Auto-Lockout

- **Status:** READY
- **Goal:** Implement client-side inactivity detection that clears the `activeUser` cookie server-side and returns the device to `/select-user` after 5 minutes of no user interaction.
- **Scope:**
  - `InactivityProvider` React context component (`components/InactivityProvider.tsx`) — `"use client"`
  - Listens for `mousemove`, `keydown`, `pointerdown`, `touchstart` events on `window`
  - Resets a 5-minute countdown timer on every event
  - On timer expiry: POST to a Server Action (`clearActiveUser`) that clears the `activeUser` cookie
  - After cookie cleared: client calls `router.replace('/select-user')`
  - `InactivityProvider` wraps the authenticated layout only
  - Explicit sign-off button calls the same `clearActiveUser` Server Action and navigates to `/select-user`
- **Out of Scope:** Server-side timeout enforcement, inactivity on unauthenticated routes
- **Acceptance Criteria:**
  - After 5 minutes of no user interaction on an authenticated page, `activeUser` cookie is cleared and browser navigates to `/select-user`
  - Any user interaction resets the 5-minute timer
  - After auto-lockout, a subsequent page load confirms `activeUser` cookie is absent
  - Explicit sign-off clears cookie and navigates to `/select-user` immediately
  - `InactivityProvider` does not attach event listeners on unauthenticated routes
- **Dependencies:** PBI-001, PBI-003b, PBI-004
- **Systems Affected:** frontend, backend
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-004: Role-Based Middleware

- **Status:** READY
- **Goal:** Implement Next.js `middleware.ts` to enforce active-user presence and role-based route protection on every request by reading the signed `activeUser` cookie — no Supabase session is used.
- **Scope:**
  - `middleware.ts` at project root
  - On every request: read and verify the signed `activeUser` cookie using `ACTIVE_USER_SECRET`
  - If cookie is absent or signature is invalid → redirect to `/select-user`
  - Extract `role` from the verified cookie payload (no DB call per request)
  - `staff` role: allowed to access `/staff/*`
  - `staff` role visiting `/dashboard` → redirect to `/staff`
  - `member` role: allowed to access `/dashboard` only
  - `member` role attempting `/staff/*` → redirect to `/dashboard`
  - `/select-user`, `/pin`, `/setup-pin` are not protected — middleware passes them through
  - Matcher config excludes `/_next/`, `/api/`, and static assets
- **Out of Scope:** Supabase session validation, DB lookups per request, page UI
- **Acceptance Criteria:**
  - Request with no `activeUser` cookie to a protected route redirects to `/select-user`
  - Request with a tampered/invalid cookie to a protected route redirects to `/select-user`
  - Valid `staff` cookie allows access to `/staff/*`
  - Valid `member` cookie accessing `/staff/*` redirects to `/dashboard`
  - Valid `staff` cookie accessing `/dashboard` redirects to `/staff`
  - `/select-user`, `/pin`, `/setup-pin` accessible without any cookie
  - No Supabase DB call made inside middleware
  - All redirects are server-side
- **Dependencies:** PBI-001, PBI-002, PBI-003, PBI-003b, PBI-003c
- **Systems Affected:** backend, frontend
- **Risk Level:** High (all route protection depends on this)
- **Estimated Effort:** M

---

## PBI-005: Staff Dashboard — Members List Page

- **Status:** READY
- **Goal:** Implement the `/staff/members` page that displays a list of all users with the `member` role, visible to staff only.
- **Scope:**
  - `/app/staff/members/page.tsx` — Server Component
  - Read active user from `activeUser` cookie to confirm `role = 'staff'` (middleware already enforces this)
  - Fetch all profiles where `role = 'member'` server-side using `SUPABASE_SERVICE_ROLE_KEY`
  - Display: `display_name`, `avatar_url` (fallback initials), `created_at`
  - Basic Tailwind-styled table or card list
  - Navigation link to `/staff/staff`
- **Out of Scope:** Pagination, search/filter, editing profiles, member detail pages
- **Acceptance Criteria:**
  - Page renders a list of all member profiles
  - Data is fetched server-side via service role
  - Page is inaccessible without a valid `staff` activeUser cookie (middleware enforces)
  - Empty state is handled gracefully (e.g. "No members found")
- **Dependencies:** PBI-002, PBI-004
- **Systems Affected:** frontend, supabase
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-006: Staff Dashboard — Staff List Page

- **Status:** READY
- **Goal:** Implement the `/staff/staff` page that displays a list of all users with the `staff` role, visible to staff only.
- **Scope:**
  - `/app/staff/staff/page.tsx` — Server Component
  - Fetch all profiles where `role = 'staff'` server-side using `SUPABASE_SERVICE_ROLE_KEY`
  - Display: `display_name`, `avatar_url` (fallback initials), `created_at`
  - Basic Tailwind-styled table or card list
  - Navigation link to `/staff/members`
- **Out of Scope:** Pagination, search/filter, editing profiles, staff detail pages
- **Acceptance Criteria:**
  - Page renders a list of all staff profiles
  - Data is fetched server-side via service role
  - Page is inaccessible without a valid `staff` activeUser cookie (middleware enforces)
  - Empty state is handled gracefully
- **Dependencies:** PBI-002, PBI-004
- **Systems Affected:** frontend, supabase
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-007: Member Dashboard — Personal Profile Page

- **Status:** READY
- **Goal:** Implement the `/dashboard` page that shows a logged-in member their own profile information only.
- **Scope:**
  - `/app/dashboard/page.tsx` — Server Component
  - Read `profileId` from `activeUser` cookie
  - Fetch the profile for that `profileId` server-side using `SUPABASE_SERVICE_ROLE_KEY`
  - Display: `display_name`, `role`, `avatar_url` (if present, else initials), `created_at`
  - Sign-off button that calls the `clearActiveUser` Server Action (from PBI-003d)
  - Basic Tailwind styling
- **Out of Scope:** Profile editing, avatar upload, any other users' data
- **Acceptance Criteria:**
  - Logged-in member sees only their own profile data
  - Page is inaccessible without a valid `member` activeUser cookie (middleware enforces)
  - `staff` activeUser cookie visiting `/dashboard` is redirected to `/staff` (middleware)
  - Sign-off button clears cookie and redirects to `/select-user`
  - Avatar displayed if `avatar_url` present; initials fallback if null
- **Dependencies:** PBI-002, PBI-003b, PBI-004
- **Systems Affected:** frontend, supabase
- **Risk Level:** Low
- **Estimated Effort:** S
