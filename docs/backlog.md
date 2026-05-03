# Product Backlog — Golf Club Management App (Phase 1 MVP)

_Managed by Planner. Executed by Coder. Source of truth: /docs/SAD.md_

## Status Model

Use these statuses to keep backlog state aligned with branch, PR, and deployment flow.

- READY: The PBI is clarified, unblocked, and ready to start. No implementation branch is required yet.
- IN_PROGRESS: A dedicated branch exists for the PBI and implementation is underway on that branch.
- DEV_DONE: Implementation for the PBI is complete on its branch and a PR to main is ready to open or has just been opened.
- TESTING: A PR from the PBI branch to main is open. Review, fixes, and validation continue on the same branch, and the PR should have a Vercel preview deployment.
- DONE: The PR to main is merged and required tests have passed. Production deployment happens from main only after merge.

---

## PBI-001: Project Scaffold

- **Status:** DONE
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

- **Status:** DONE
- **Goal:** Create the `public.profiles` table with role, PIN hash, lockout tracking columns, and Row Level Security policies that enforce access rules at the database level.
- **Scope:**
  - Migration SQL written to `/supabase/schema.sql`
  - `profiles` table columns:
    - `id` (uuid, PK, FK → auth.users ON DELETE CASCADE)
    - `display_name` (text, not null)
    - `role` (text, CHECK IN ('staff','admin'), not null)
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

- **Status:** DONE
- **Goal:** Implement the `/select-user` route — a server-rendered grid of selectable staff/admin profile cards that allows a user to identify themselves before PIN entry.
- **Scope:**
  - `/app/select-user/page.tsx` — Server Component
  - Fetch all profiles where `role IN ('staff', 'admin')` server-side using `SUPABASE_SERVICE_ROLE_KEY` (no Supabase session required)
  - Display each profile as a card: `display_name` + `avatar_url` (fallback to initials if null)
  - Cards for profiles where `pin_locked_until` is in the future display a "Locked" badge and are non-interactive
  - Unlocked cards with `pin_hash` set navigate to `/pin?userId=<profileId>` on tap
  - Unlocked cards with `pin_hash = null` navigate to `/setup-pin?userId=<profileId>` on tap
  - Error message display (`?error=locked` query param renders a visible lockout notice)
  - No `activeUser` cookie or Supabase session required to render this page
- **Out of Scope:** Other role cards, pagination, search, profile editing
- **Acceptance Criteria:**
  - Page renders without any active user session or cookie
  - All selectable `staff` and `admin` profiles are shown, fetched server-side via service role
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

- **Status:** DONE
- **Goal:** Implement the `/pin` route where a selected staff/admin user enters their 4-digit PIN, validated server-side via bcrypt, resulting in a signed `activeUser` cookie on success or lockout on repeated failure.
- **Scope:**
  - `/app/pin/page.tsx` — receives `userId` query param
  - Server-side guard: if the profile for `userId` has `pin_locked_until` in the future → redirect to `/select-user?error=locked`
  - Server-side guard: if `pin_hash = null` for `userId` → redirect to `/setup-pin?userId=<profileId>`
  - 4-digit PIN entry UI (numeric digit boxes)
  - On submit: Server Action receives `profileId` + `pin`
  - Server Action fetches `profiles` row via `SUPABASE_SERVICE_ROLE_KEY`
  - `bcrypt.compare(pin, pin_hash)` server-side
  - **Success:** reset `pin_fail_count = 0` → set signed `activeUser` cookie (`{ profileId, displayName, role, expiresAt: now+8h }`) signed with `ACTIVE_USER_SECRET` → redirect to `/dashboard` (middleware redirects `admin` onward to `/staff`)
  - **Failure:** increment `pin_fail_count`. If `>= 5`: set `pin_locked_until = now() + 15 minutes`, reset `pin_fail_count = 0` → redirect to `/select-user?error=locked`. Otherwise: return failure error with remaining attempts count
  - Raw PIN is never logged, stored, or returned
- **Out of Scope:** Password reset, email-based recovery, other role PIN flows, PIN change flow
- **Acceptance Criteria:**
  - Navigating to `/pin?userId=<lockedProfileId>` redirects to `/select-user?error=locked`
  - Navigating to `/pin?userId=<noPinProfileId>` redirects to `/setup-pin?userId=<profileId>`
  - Correct PIN sets a signed `httpOnly` `activeUser` cookie and redirects to `/dashboard`
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

- **Status:** DONE
- **Goal:** Implement the `/setup-pin` route for a selected staff/admin user whose `pin_hash` is null — requiring one-time email + password verification before allowing them to set their PIN.
- **Scope:**
  - `/app/setup-pin/page.tsx` — receives `userId` query param
  - Server-side guard: if `pin_hash` is already set for `userId` → redirect to `/pin?userId=<profileId>`
  - Step 1: email + password fields (identity verification)
  - Server Action: call `supabase.auth.signInWithPassword({ email, password })` server-side
  - Verify authenticated user's email matches the profile record email for `userId` — mismatch → error
  - Step 2 (after verified): 4-digit PIN entry + confirmation
  - Server Action: validate PIN is exactly 4 numeric digits and both fields match
  - On valid PIN: `bcrypt.hash(pin, 10)` → save to `profiles.pin_hash` via service role
  - Set signed `activeUser` cookie → redirect to `/dashboard` (middleware redirects `admin` onward to `/staff`)
  - On mismatch or invalid format: inline error, do not write to DB
  - Raw PIN never logged or returned
- **Out of Scope:** PIN change after setup, forgot-PIN flow, admin-initiated PIN reset, other role PIN setup
- **Acceptance Criteria:**
  - Navigating to `/setup-pin?userId=<profileId>` where `pin_hash` is already set redirects to `/pin?userId=<profileId>`
  - Mismatched email/password shows an error and does not proceed
  - Email not matching the profile record shows an error and does not proceed
  - Mismatched or non-4-digit PIN shows an error and does not write to DB
  - On success, `profiles.pin_hash` contains a valid bcrypt hash
  - On success, signed `activeUser` cookie is set and user is redirected to `/dashboard`
  - Raw PIN never in logs or response body
- **Dependencies:** PBI-001, PBI-002, PBI-003
- **Systems Affected:** frontend, backend, supabase
- **Risk Level:** High (PIN storage must be hashed; identity verification must match profile record)
- **Estimated Effort:** M

---

## PBI-003d: Inactivity Auto-Lockout

- **Status:** DONE
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

- **Status:** DONE
- **Goal:** Implement Next.js `middleware.ts` to enforce active-user presence and route protection on every request by reading the signed `activeUser` cookie — no Supabase session is used.
- **Scope:**
  - `middleware.ts` at project root
  - On every request: read and verify the signed `activeUser` cookie using `ACTIVE_USER_SECRET`
  - If cookie is absent or signature is invalid → redirect to `/select-user`
  - Extract `role` from the verified cookie payload (no DB call per request)
  - Both `admin` and `staff` roles can access `/dashboard`
  - `/staff/*` routes redirect to `/dashboard` (not yet implemented)
  - `/select-user`, `/pin`, `/setup-pin` are not protected — middleware passes them through
  - Matcher config excludes `/_next/`, `/api/`, and static assets
- **Out of Scope:** Supabase session validation, DB lookups per request, page UI, role-based routing within authenticated area
- **Acceptance Criteria:**
  - Request with no `activeUser` cookie to a protected route redirects to `/select-user`
  - Request with a tampered/invalid cookie to a protected route redirects to `/select-user`
  - Both `admin` and `staff` roles can access `/dashboard`
  - `/staff/*` routes redirect to `/dashboard`
  - `/select-user`, `/pin`, `/setup-pin` accessible without any cookie
  - No Supabase DB call made inside middleware
  - All redirects are server-side
- **Dependencies:** PBI-001, PBI-002, PBI-003, PBI-003b, PBI-003c
- **Systems Affected:** backend, frontend
- **Risk Level:** High (all route protection depends on this)
- **Estimated Effort:** M

---

## PBI-005: Admin Dashboard Layout

- **Status:** DONE
- **Goal:** Create the admin dashboard shell with a left side menu and admin-only dashboard pages.
- **Scope:**
  - Create `/app/dashboard/layout.tsx` for the admin dashboard shell
  - Left side menu includes: `Submissions` and `Members`
  - Create `/app/dashboard/page.tsx` as the admin dashboard landing page
  - Create blank admin pages `/app/dashboard/submissions/page.tsx` and `/app/dashboard/members/page.tsx`
  - Dashboard content renders to the right of the side menu
- **Out of Scope:** Real submissions data, real members data, CRUD flows, filters, search
- **Acceptance Criteria:**
  - Admin users can access `/dashboard`
  - The dashboard shows a left side menu with `Submissions` and `Members`
  - `/dashboard/submissions` and `/dashboard/members` exist as blank placeholder pages
  - The selected admin page renders in the main content area to the right of the side menu
- **Dependencies:** PBI-002, PBI-004
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-006: Staff Membership Registration

- **Status:** DONE
- **Goal:** Create the staff landing page at `/dashboard/membership-registration`.
- **Scope:**
  - Create `/app/dashboard/membership-registration/page.tsx`
  - Page contains two buttons: `New Membership` and `Membership Renewal`
  - This page does not use the admin dashboard side menu
  - Buttons are placeholders only for now
- **Out of Scope:** Form flows, payments, renewals logic, submissions logic, member creation logic
- **Acceptance Criteria:**
  - Staff users can access `/dashboard/membership-registration`
  - The page shows `New Membership` and `Membership Renewal` buttons
  - The page renders as a standalone staff page, not inside the admin dashboard shell
- **Dependencies:** PBI-002, PBI-004
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-007: Middleware Role Routing

- **Status:** DONE
- **Goal:** Route admin and staff users to different authenticated destinations after login.
- **Scope:**
  - Update middleware role routing so `admin` users land on `/dashboard`
  - Update middleware role routing so `staff` users land on `/dashboard/membership-registration`
  - Reserve `/dashboard`, `/dashboard/submissions`, and `/dashboard/members` for admin users
  - Allow both admin and staff users to access `/dashboard/membership-registration`
  - Keep PIN and setup-PIN success redirects simple; middleware performs the final role-based routing
- **Out of Scope:** Changing page UI, implementing form logic, submissions logic, members logic
- **Acceptance Criteria:**
  - Admin login ends on `/dashboard`
  - Staff login ends on `/dashboard/membership-registration`
  - Admin users can access `/dashboard`, `/dashboard/submissions`, and `/dashboard/members`
  - Staff users attempting to access admin dashboard routes are redirected to `/dashboard/membership-registration`
  - Admin users can also access `/dashboard/membership-registration` when needed
  - All routing enforcement is server-side in middleware
- **Dependencies:** PBI-002, PBI-004, PBI-005, PBI-006
- **Systems Affected:** backend, frontend
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-008: New Member Flow Entry

- **Status:** IN_PROGRESS
- **Goal:** Handle the `New Membership` button click from the staff membership registration page.
- **Scope:**
  - Add navigation behavior for the `New Membership` button on `/dashboard/membership-registration`
  - Define and create the destination route for the new-member entry page
  - Show simple placeholder content on the destination page only
  - Allow both staff and admin users to access this route
- **Out of Scope:** Full registration form, validation, payments, persistence
- **Acceptance Criteria:**
  - Staff users can click `New Membership`
  - The click navigates to the new-member destination page
  - The destination page displays simple placeholder text only
  - The route is accessible to both staff and admin users
- **Dependencies:** PBI-004, PBI-006, PBI-007
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-009: Membership Renewal Flow Entry

- **Status:** READY
- **Goal:** Handle the `Membership Renewal` button click from the staff membership registration page.
- **Scope:**
  - Add navigation behavior for the `Membership Renewal` button on `/dashboard/membership-registration`
  - Define and create the destination route for the membership-renewal entry page
  - Show simple placeholder content on the destination page only
  - Allow both staff and admin users to access this route
- **Out of Scope:** Renewal form, payment handling, lookup logic, persistence
- **Acceptance Criteria:**
  - Staff users can click `Membership Renewal`
  - The click navigates to the membership-renewal destination page
  - The destination page displays simple placeholder text only
  - The route is accessible to both staff and admin users
- **Dependencies:** PBI-004, PBI-006, PBI-007
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-010: Admin Dashboard Quick Access Buttons

- **Status:** READY
- **Goal:** Add quick-access buttons to the admin dashboard landing page for `New Member` and `Membership Renewal`.
- **Scope:**
  - Add two quick-access buttons on `/dashboard`
  - Buttons are labeled `New Member` and `Membership Renewal`
  - The buttons sit inside the dashboard content area, not in the side menu
  - `New Member` button links to the same new-member entry route defined in PBI-008
  - `Membership Renewal` button links to the same membership-renewal entry route defined in PBI-009
  - Buttons are visible to admin users only
- **Out of Scope:** Form logic, button styling polish beyond basic layout, submission handling
- **Acceptance Criteria:**
  - Admin users see `New Member` and `Membership Renewal` quick-access buttons on `/dashboard`
  - The buttons are rendered in the main dashboard content area, not the side menu
  - Each button navigates to the same destination route used by the corresponding staff flow entry
  - Staff access the new-member and renewal flows via buttons on `/dashboard/membership-registration`; admin accesses them via quick-access buttons on `/dashboard`
- **Dependencies:** PBI-005, PBI-007, PBI-008, PBI-009
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S