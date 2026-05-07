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

- **Status:** DONE
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

- **Status:** DONE
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

- **Status:** DONE
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

---

## PBI-011: Shared Membership Flow Choice Step With Preserved Flow Context

- **Status:** DONE
- **Goal:** Introduce one shared intermediate step for membership flow entry that asks the user to choose between `Membership Form` and `Generate Email Form`, while preserving the original membership intent for the next step in the flow.
- **Scope:**
  - Create a shared membership-flow choice screen used by all supported entry journeys
  - Display exactly two options: `Membership Form` and `Generate Email Form`
  - Accept and retain the originating membership intent: `New Membership` or `Membership Renewal`
  - Capture and retain the selected next action together with the original intent as shared flow context
  - Pass that shared flow context forward to the next step without losing it
  - Make the screen usable regardless of which supported entry point the user arrived from
- **Out of Scope:** Real form implementation, real email generation, persistence beyond what is needed to carry flow context
- **Acceptance Criteria:**
  - Selecting `New Membership` from any supported entry point opens the same shared choice step
  - Selecting `Membership Renewal` from any supported entry point opens the same shared choice step
  - The choice step clearly shows `Membership Form` and `Generate Email Form`
  - After the user chooses an option, the system still has both the selected next action and the original membership intent available for the next step
  - No supported entry point bypasses this step before the flow continues
- **Dependencies:** PBI-008, PBI-009, PBI-010
- **Systems Affected:** frontend
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-012: Unify Entry-Point Routing To Shared Choice Step

- **Status:** DONE
- **Goal:** Refactor all supported membership entry points so they route into the shared choice-step flow instead of using separate per-entry navigation logic.
- **Scope:**
  - Update the membership-registration entry buttons to use the shared flow
  - Update the admin dashboard quick-access buttons to use the same shared flow
  - Update any kiosk membership entry surface to use the same shared flow
  - Remove duplicated routing decisions where different entry points branch separately
  - Keep labels and entry surfaces unchanged while standardising behaviour underneath
- **Out of Scope:** Changing visual design of the existing buttons, implementing the downstream form/email screens themselves
- **Acceptance Criteria:**
  - `New Membership` behaves the same from every supported entry point
  - `Membership Renewal` behaves the same from every supported entry point
  - All supported entry points route through one shared decision path before any downstream screen
  - There is no entry-point-specific logic for deciding whether the user goes to the choice step
- **Dependencies:** PBI-011
- **Systems Affected:** frontend
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-013: Renewal Search, Membership Type Selection, And Final Flow Handoff

- **Status:** DONE
- **Goal:** Send the user from the shared choice step through the required member-selection and membership-type steps, then into the correct final screen while carrying forward the full flow context.
- **Scope:**
  - Route both `Membership Form` and `Generate Email Form` choices for `New Membership` directly from the shared choice step to a membership-type selection screen
  - Route both `Membership Form` and `Generate Email Form` choices for `Membership Renewal` to an existing-member search-and-select step before membership-type selection
  - Allow the renewal flow to search and select an existing member
  - After the renewal member is selected, show the same membership-type selection screen used by the new-member flow
  - Allow the membership-type selection screen to choose one membership type from the available membership types
  - Preserve the selected next action and original membership intent through the renewal search step when present
  - Preserve the selected membership type and selected renewal member when present through the final handoff
  - After membership type is selected, send the user to the previously chosen final screen with all preserved context applied
  - Ensure downstream screens can read and use the preserved context consistently across supported entry points
- **Out of Scope:** Full form logic, email sending logic, backend persistence beyond what is needed to maintain context between steps
- **Acceptance Criteria:**
  - Choosing `Membership Form` after starting `New Membership` opens the membership-type selection screen before the final form flow
  - Choosing `Generate Email Form` after starting `New Membership` opens the membership-type selection screen before the final email flow
  - Choosing either option after starting `Membership Renewal` opens an existing-member search step before membership-type selection
  - A renewal user must select an existing member before the membership-type selection screen is shown
  - The membership-type selection screen allows the user to choose a membership type
  - After membership type is selected, the user is taken to the previously chosen final screen
  - The final screen receives the selected next action, the original membership intent, and the selected membership type
  - For renewals, the final screen also receives the selected member
  - The downstream screen receives consistent flow context regardless of which supported entry point the user originally used
- **Dependencies:** PBI-011, PBI-012
- **Systems Affected:** frontend
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-014: Shared Four-Step Membership Form Shell And Context Handoff

- **Status:** DONE
- **Goal:** Introduce one shared 4-step membership form shell for the `Membership Form` path, used by both `New Membership` and `Membership Renewal` after membership type selection is confirmed, while preserving all required flow context.
- **Scope:**
  - Route the `Membership Form` journey from the PBI-013 handoff into one shared 4-step form
  - Use the same form shell for both `New Membership` and `Membership Renewal`
  - Define the 4 steps in order:
    - `Personal Details`
    - `Membership Details`
    - `Safeguarding & Medical`
    - `Additional Info and Consent`
  - Provide `Next` and `Back` navigation between steps
  - Preserve flow context throughout the form:
    - `New Membership` vs `Membership Renewal`
    - `Membership Form` vs `Generate Email Form`
    - Selected member for renewal when present
    - Membership type
  - Ensure step-to-step navigation does not lose entered data within the current form session
  - Render Step 4 as a placeholder section only for now
- **Out of Scope:** Final submission or persistence of the form, `Generate Email Form` implementation, field-level implementation for Steps 1 to 3 beyond what is needed to mount the shared shell
- **Acceptance Criteria:**
  - After membership type confirmation in the `Membership Form` path, `New Membership` opens the shared 4-step form
  - After membership type confirmation in the `Membership Form` path, `Membership Renewal` opens the same shared 4-step form
  - The form shows four ordered steps with `Next` and `Back` navigation
  - The flow context remains available on every step
  - For renewal journeys, the selected member remains available throughout the form
  - Navigating between steps does not clear already entered form values during the current session
  - Step 4 is present as a placeholder and does not require final content yet
- **Dependencies:** PBI-013
- **Systems Affected:** frontend, tests
- **Risk Level:** Medium
- **Estimated Effort:** S

---

## PBI-015: Personal Details Step With Validation

- **Status:** DONE
- **Goal:** Implement Step 1 of the shared membership form with the required Personal Details fields and step-level validation.
- **Scope:**
  - Implement Step 1 fields:
    - `First Name`
    - `Surname`
    - `Date of Birth`
    - `Gender (Male / Female)`
    - `Address Line 1`
    - `Address Line 2`
    - `Address Line 3`
    - `City`
    - `County`
    - `Postal Code`
    - `Country`
    - `Email`
    - `Mobile Phone`
  - Add step-level validation for obviously required inputs and invalid formats where applicable
  - Prevent `Next` navigation while Step 1 is invalid
  - Preserve entered Step 1 values when moving forward and back within the form
- **Out of Scope:** Renewal-based prefilling of member details, backend persistence, any validation rules not directly implied by the listed fields and standard input formats
- **Acceptance Criteria:**
  - Step 1 displays all required Personal Details fields
  - The user cannot progress from Step 1 while required fields are incomplete or invalid
  - Email input is validated as an email format
  - Date of Birth input rejects invalid date values
  - Returning to Step 1 after moving forward retains previously entered values during the current form session
  - Step 1 works the same for both `New Membership` and `Membership Renewal` flows
- **Dependencies:** PBI-014
- **Systems Affected:** frontend, tests
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-016: Membership Details Step With Conditional Field Behaviour

- **Status:** DONE
- **Goal:** Implement Step 2 of the shared membership form with the required Membership Details fields and the explicitly defined enable/disable and prefill behaviour.
- **Scope:**
  - Implement Step 2 fields:
    - `Will Cruit Island Golf Club be your home club? (Yes / No)`
    - `Home Club`
    - `Are you or have you been a member of another club? (Yes / No)`
    - `Previous Clubs`
    - `Golf Ireland Number / GHIN`
    - `Do you have a current handicap index or ever had one? (Yes / No)`
    - `Handicap Index`
  - Disable `Home Club` when `Will Cruit Island Golf Club be your home club?` is answered `Yes`
  - Prefill `Previous Clubs` from `Home Club` when `Home Club` has been entered, while still allowing additional text input
  - Disable `Golf Ireland Number / GHIN` when:
    - `Home Club` is not provided, or
    - `Are you or have you been a member of another club?` is answered `No`
  - Apply step-level validation only to the rules explicitly defined in this requirement
  - Preserve entered Step 2 values when moving forward and back within the form
- **Out of Scope:** Any conditional rule for `Handicap Index` beyond what is explicitly confirmed later, club lookup integrations or autocomplete, backend persistence
- **Acceptance Criteria:**
  - Step 2 displays all required Membership Details fields
  - Selecting `Yes` for Cruit as home club disables the `Home Club` field
  - When `Home Club` is entered, `Previous Clubs` is prefilled with that value and still allows additional text input
  - `Golf Ireland Number / GHIN` is disabled when `Home Club` is empty
  - `Golf Ireland Number / GHIN` is disabled when previous club membership is answered `No`
  - `Golf Ireland Number / GHIN` becomes available only when `Home Club` is provided and previous club membership is answered `Yes`
  - Returning to Step 2 after moving forward retains previously entered values during the current form session
  - Step 2 works the same for both `New Membership` and `Membership Renewal` flows
- **Dependencies:** PBI-014
- **Systems Affected:** frontend, tests
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-017: Safeguarding And Medical Step Plus Final Placeholder Step

- **Status:** DONE
- **Goal:** Complete the remaining form journey by implementing Step 3 fields, keeping Step 4 as a placeholder, and validating navigation through to the end of the shared form.
- **Scope:**
  - Implement Step 3 fields:
    - `Emergency Contact Name`
    - `Emergency Contact Relationship`
    - `Phone Number`
    - `Allergies`
    - `Medications`
    - `Additional Assistance`
  - Add step-level validation where needed for contact details
  - Implement Step 4 as an `Additional Info and Consent` placeholder section only
  - Ensure the user can navigate from Step 3 to Step 4 and back without losing entered data
  - Ensure the full 4-step flow remains consistent for both `New Membership` and `Membership Renewal`
- **Out of Scope:** Final Step 4 content definition, consent capture rules beyond placeholder presentation, final form submission or persistence
- **Acceptance Criteria:**
  - Step 3 displays all required Safeguarding & Medical fields
  - Step 3 blocks forward navigation when required emergency contact details are incomplete or invalid
  - Step 4 is reachable from Step 3 and is clearly marked as placeholder content
  - The user can navigate back from Step 4 to earlier steps without losing entered values during the current form session
  - The complete 4-step form remains usable for both `New Membership` and `Membership Renewal` flows
  - All preserved context from the entry flow is still available at Step 4
- **Dependencies:** PBI-014, PBI-015, PBI-016
- **Systems Affected:** frontend, tests
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-018: Membership Registration Action Cards UI Refresh

- **Status:** DONE
- **Goal:** Redesign the existing membership-registration dashboard view with a clean, modern, card-based layout that presents `New Member` and `Membership Renewal` as the two primary actions.
- **Scope:**
  - Update the visual design of the existing `/dashboard/membership-registration` screen only
  - Preserve the two existing primary actions: `New Member` and `Membership Renewal`
  - Use a clean, minimal, modern light-theme design with generous whitespace and a soft neutral colour palette
  - Use a very light grey page background of `#f5f6f5`
  - Display a small label reading `Choose a` in colour `#bab9bd`
  - Display a larger heading reading `Membership` in colour `#2b2b2b` (Label and header are the same font size with different colours only)
  - Present each action as a vertically stacked card/button with:
    - white background `#ffffff`
    - very light grey border `#eeeeee`
    - large rounded corners of about `16px`
    - subtle soft shadow
  - Include card content with:
    - a left-side circular icon container using light grey `#f0f0f0`
    - a centred icon inside that container
    - a right-side title using medium-weight dark text `#282828`
    - a smaller muted description using grey `#969696`
  - Add hover and interaction states with a slightly stronger shadow or a very subtle scale increase around `1.01`, smooth transition, and pointer cursor
  - Centre the content on the page with a max width around `400px` to `500px`
  - Keep the cards stacked vertically with about `16px` spacing between cards and about `24px` to `32px` spacing between the heading area and the cards
  - Ensure the layout remains touch-friendly and works well on tablet and kiosk screens while staying vertically stacked
- **Out of Scope:** Any routing changes, navigation changes, click-handler changes, flow logic changes, data changes, schema changes, or backend work
- **Acceptance Criteria:**
  - The existing membership-registration page is visually redesigned into a clean, modern card-based layout
  - The page shows `Choose a` as a label above the main heading `Membership`
  - The page displays exactly two vertically stacked action cards: `New Member` and `Membership Renewal`
  - Each card uses a white surface, light border, large rounded corners, and a subtle soft shadow
  - Each card includes an icon container on the left plus title and description content on the right
  - Hovering an action card gives clear but subtle visual feedback through shadow and/or very slight scale change
  - The content is centred and constrained to an appropriate narrow width for a focused dashboard action screen
  - The screen remains touch-friendly and visually usable on tablet and kiosk-sized displays
  - Existing routes, navigation targets, and handlers for both actions remain unchanged
  - The change is limited to the visual UI layer only
  - All colour values match the exact specifications: page background `#f5f6f5`, label `#bab9bd`, header `#2b2b2b`, card background `#ffffff`, card border `#eeeeee`, card icon container `#f0f0f0`, card title `#282828`, card description `#969696`
- **Dependencies:** PBI-006
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-019: Membership Flow Action Cards UI Refresh

- **Status:** DONE
- **Goal:** Redesign the existing shared membership flow choice screen with a clean, modern, card-based layout that presents `Membership Form` and `Generate Email Form` as the two primary actions.
- **Scope:**
  - Update the visual design of the existing `/dashboard/membership-flow` screen only
  - Preserve the two existing primary actions: `Membership Form` and `Generate Email Form`
  - Use the same finalized colours and design language as PBI-018 with a clean, minimal, modern light-theme design, generous whitespace, and a soft neutral palette
  - Use page background `#f5f6f5`
  - Display label text `Choose which` using `#bab9bd`
  - Display header text `Form` using `#2b2b2b`
  - Use the same font size for the label and header, with colour as the visual differentiator only
  - Present each action as a vertically stacked card/button with:
    - white background `#ffffff`
    - very light grey border `#eeeeee`
    - large rounded corners of about `16px`
    - subtle soft shadow
  - Include card content with:
    - a left-side circular icon container using light grey `#f0f0f0`
    - a centred icon inside that container
    - a right-side title using medium-weight dark text `#282828`
    - a smaller muted description using grey `#969696`
  - Add hover and interaction states with a slightly stronger shadow or a very subtle scale increase around `1.01`, smooth transition, and pointer cursor
  - Centre the content on the page with a max width around `400px` to `500px`
  - Keep the cards stacked vertically with about `16px` spacing between cards and about `24px` to `32px` spacing between the heading area and the cards
  - Ensure the layout remains touch-friendly and works well on tablet and kiosk screens while staying vertically stacked
  - Add a subtle back button in the bottom-left area of the page, visually secondary and consistent with the minimal design
- **Out of Scope:** Any routing changes, navigation changes, click-handler changes, flow logic changes, state-handling changes, data changes, schema changes, or backend work
- **Acceptance Criteria:**
  - The existing membership-flow page is visually redesigned into a clean, modern card-based layout
  - The page at `/dashboard/membership-flow` shows `Choose which` as small muted label text above the main heading `Form`
  - The page uses the same finalized PBI-018 palette: background `#f5f6f5`, label `#bab9bd`, header `#2b2b2b`, card background `#ffffff`, card border `#eeeeee`, icon container `#f0f0f0`, card title `#282828`, and card description `#969696`
  - The label and header use the same font size, with colour as the only visual distinction between them
  - The page displays exactly two vertically stacked action cards: `Membership Form` and `Generate Email Form`
  - Each card uses a white surface, light border, large rounded corners, and a subtle soft shadow
  - Each card includes an icon container on the left plus title and description content on the right
  - Hovering an action card gives clear but subtle visual feedback through shadow and/or very slight scale change
  - The content is centred and constrained to an appropriate narrow width for a focused action screen
  - The screen remains touch-friendly and visually usable on tablet and kiosk-sized displays
  - A subtle back button is shown in the bottom-left area of the page using the existing navigation behaviour only
  - Existing routes, navigation targets, click handlers, flow logic, and state handling for both actions remain unchanged
  - The back button preserves existing back-navigation behaviour only and does not introduce new routing or logic
  - The change is limited to the visual UI layer only
- **Dependencies:** PBI-011
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-020: Membership Type Selection Grid

- **Status:** DONE
- **Goal:** Design and implement a membership type selection screen with a clean, grid-based card layout that displays 10 membership type options as independently clickable buttons matching the finalized design system from PBI-018 and PBI-019.
- **Scope:**
  - Create `/dashboard/membership-type` page (or appropriate route based on membership flow)
  - Use the same finalized colour palette and design language as PBI-018/019:
    - Page background: `#f5f6f5`
    - Label text: `#bab9bd`
    - Header text: `#2b2b2b`
    - Card background: `#ffffff`
    - Card border: `#eeeeee`
    - Card icon container: `#f0f0f0`
    - Card title text: `#282828`
    - Card description text: `#969696`
  - Display a heading area with:
    - Label: `Choose a` (colour `#bab9bd`, same font size as heading)
    - Heading: `Membership Type` (colour `#2b2b2b`, same font size as label)
  - Create a 2-column grid of membership type option cards:
    - 10 cards total arranged in 2 columns (5 rows)
    - Each card is a clickable button using the same card design: white background, light border, rounded corners (~16px), subtle shadow
    - Each card includes:
      - A left-side icon container (circular, light grey background `#f0f0f0`)
      - A right-side title and description area
      - Title: membership type name (dark text `#282828`)
      - Description: brief membership type description (grey text `#969696`)
    - Cards are smaller than the PBI-018/019 action cards to fit the grid while filling the available space
    - Hover state: subtle shadow increase and/or scale, smooth transition, pointer cursor
  - Clicking any membership type card directly navigates to the next step in the flow with that membership type selected (no separate `Continue` button required)
  - The grid fills the same vertical space as the 2 action buttons do on the membership flow page
  - Preserve the finalized kiosk-friendly, touch-friendly design from PBI-018/019
  - The page is responsive: remains readable and touch-friendly on tablet and kiosk screens
- **Out of Scope:** Form validation, backend persistence, membership type data source, membership type definitions, any routing or logic changes beyond direct selection navigation
- **Acceptance Criteria:**
  - The membership-type page is visually redesigned with a clean, modern grid-based card layout
  - The page shows `Choose a` as muted label text and `Membership Type` as the main heading, using the exact finalized colours
  - The page displays exactly 10 membership type option cards in a 2-column grid (5 rows)
  - Each card uses white background, light border, rounded corners, and subtle shadow consistent with PBI-018/019
  - Each card includes an icon container on the left and title/description on the right
  - Hovering a card provides clear but subtle visual feedback through shadow and/or scale
  - Each card is independently clickable and navigates directly to the next step with that membership type selected
  - The grid fills the available space proportional to the 2-button layout on the membership flow page
  - The screen remains touch-friendly and visually usable on tablet and kiosk-sized displays
  - No separate `Continue` or `Next` button is required; selection via card click is the only navigation method
  - The change is limited to the visual UI layer and direct card-selection routing only
- **Dependencies:** PBI-018, PBI-019
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** M

---

## PBI-021: Select User UI Refresh

- **Status:** DONE
- **Goal:** Redesign the existing `/select-user` screen to match the finalized design system from PBI-018, PBI-019, and PBI-020 while preserving all existing navigation, routing, and business logic exactly as-is.
- **Scope:**
  - Update the visual design of the existing `/select-user` page only
  - Use the same finalized colour palette as PBI-018/019/020:
    - Page background: `#f5f6f5`
    - Label text: `#bab9bd`
    - Header text: `#2b2b2b`
    - Card background: `#ffffff`
    - Card border: `#eeeeee`
    - Card icon container: `#f0f0f0`
    - Card title text: `#282828`
    - Card description text: `#969696`
  - Display a heading area with:
    - Label: `Select` in colour `#bab9bd`, same font size as heading (text-6xl)
    - Heading: `User` in colour `#2b2b2b`, same font size as label
  - Display user profile cards in a 3-column grid:
    - All cards the same height
    - Each card uses white background `#ffffff`, border `#eeeeee`, rounded-3xl corners, and shadow `0 4px 12px rgba(0, 0, 0, 0.1)`
    - Each card shows the user avatar or initials fallback and the user display name
    - Locked profiles retain their "Locked" badge visual
    - Cards fill the available horizontal space evenly (3 across)
    - Hover state: `scale-[1.02]` and `shadow-lg`, smooth transition, pointer cursor
  - Ensure the layout is centered vertically and horizontally
  - Ensure the design is kiosk-friendly and touch-friendly
- **Out of Scope:** Any routing changes, navigation changes, click-handler changes, lock logic changes, PIN flow changes, session logic, database changes, or backend work. The `?error=locked` query param rendering must remain unchanged.
- **Acceptance Criteria:**
  - The `/select-user` page is visually redesigned with the finalized design system
  - The page shows `Select` as muted label text and `User` as the main heading using the exact finalized colours and same font size
  - User profiles are displayed in a 3-column grid of equal-height cards
  - Each card uses the finalized design: white surface, light border, rounded corners, subtle shadow
  - Locked profiles retain their locked badge and remain non-interactive
  - The grid is centered and fills available space
  - Hover states are present on interactive cards
  - The screen is touch-friendly and kiosk-friendly
  - All existing routing, navigation, lock logic, PIN flow, and error display behaviour is unchanged
  - The change is limited to the visual UI layer only
- **Dependencies:** PBI-003, PBI-018, PBI-019, PBI-020
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-022: PIN Entry Screen UI Refresh

- **Status:** DONE
- **Goal:** Redesign the existing PIN entry screen to use a clean, modern keypad-style layout similar to a mobile PIN entry screen, consistent with the updated membership dashboard design system, while supporting the approved client-side success feedback transition that accompanies the existing successful PIN flow.
- **Scope:**
  - Update the visual design of the existing PIN entry screen only
  - Use the established visual language from the updated membership dashboard pages so the PIN screen feels consistent with the rest of the refreshed flow
  - Display a clear heading and short instruction text above the PIN input area
  - Present a 4-digit PIN indicator using visual dots or circles that reflect entered digits
  - Add a numeric keypad with buttons for digits `0` through `9`
  - Include a delete or backspace control within the keypad layout
  - Include a secondary `Cancel` action that remains visually subordinate to PIN entry
  - Ensure users can enter the PIN using both physical keyboard input and the on-screen keypad
  - Allow client-side coordination of the existing successful PIN submission state so the refreshed screen can present approved success feedback before following the established post-success navigation path
  - Ensure the layout is responsive, touch-friendly, and suitable for kiosk and tablet use
- **Out of Scope:** Any server-side authentication changes, validation rule changes, lockout behaviour changes, changes to the successful destination route, session model changes, backend work, or database work. No existing server-side PIN verification or lockout logic changes are included in this PBI.
- **Acceptance Criteria:**
  - The existing PIN entry screen is visually redesigned into a clean, modern keypad-style layout
  - The screen includes a heading and short instruction text that match the style of the refreshed membership pages
  - The screen displays a 4-digit PIN indicator using clear visual dots or circles
  - The screen displays an on-screen numeric keypad with digits `0` through `9` plus a delete or backspace action
  - Users can enter the PIN using either keyboard input or the on-screen keypad, and both input methods work together on the same screen
  - A `Cancel` action is present and visually secondary to PIN entry
  - The layout is visually consistent with the existing refreshed dashboard and membership flow pages
  - The keypad and supporting controls are touch-friendly and remain usable on mobile, tablet, and kiosk-sized screens
  - The change preserves the existing server-side authentication, validation, lockout, session, and destination-routing behavior while allowing client-side success feedback that coordinates with the existing successful PIN submission flow
- **Definition of Done:**
  - The redesigned screen matches the current dashboard design language in spacing, surface treatment, typography, and interaction states
  - On-screen keypad interaction works correctly alongside existing keyboard entry behaviour
  - The layout is responsive and comfortably usable for touch interaction across supported screen sizes
  - No existing server-side authentication or validation logic is changed as part of implementation
- **Dependencies:** PBI-018, PBI-019, PBI-021
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-023: Membership Form Stepper Layout Refresh

- **Status:** DONE
- **Goal:** Introduce a horizontal step progress indicator at the top of the existing multi-step membership form, wizard-style, while keeping the styling consistent with the current UI refreshes.
- **Scope:**
  - Add a horizontal row of steps at the top of the form
  - Each step includes a circular indicator and a label
  - Steps are exactly:
    - `Personal Details`
    - `Membership Details`
    - `Safeguarding & Medical`
    - `Additional Info & Consent`
  - Step states must distinguish current, completed, and upcoming steps visually
  - Steps are connected by a thin line with active/inactive treatment
  - Even horizontal spacing and responsive tablet/kiosk-friendly scaling
  - Show one form step at a time inside a card-style container
  - Card-style container uses white background, rounded corners, subtle border, and shadow
  - Include step title, form fields for that step, and `Next` / `Back` buttons
  - Use the same colours, spacing, and typography as the refreshed PIN screen and Select User screen
- **Form Styling Alignment:**
  - The form layout should follow a structured, desktop-style data entry layout rather than a simple stacked mobile form
  - Use a two-column grid layout for fields where space allows
  - Inputs should use a minimal style (underline or light border, not heavy boxed inputs)
  - Group fields into clearly labeled sections (e.g. `Personal Details`, `Contact Information`)
  - Labels should be:
    - consistently positioned (above or aligned)
    - clearly associated with inputs
  - The form container should be wider than previous card layouts to support multi-column input
  - Primary action (`Next` / `Submit`) should be aligned to the bottom right
- **Out of Scope:**
  - Any changes to existing form logic, validation, conditional field behavior, or preserved flow context
  - Any new colour scheme or visual system divergent from current refreshed UI
- **Acceptance Criteria:**
  - A visible horizontal stepper is shown across the top of the membership form
  - The stepper visually distinguishes current, completed, and upcoming steps
  - The form displays one step at a time inside a card-style container with a white surface, rounded corners, subtle border, and shadow
  - The stepper and card layout are visually consistent with the refreshed PIN screen and Select User screen
  - The layout remains responsive, touch-friendly, and usable on tablet and kiosk-sized displays
  - Existing form logic, validation, and conditional field behavior remain unchanged
  - The full flow context remains preserved throughout the form, including `new/renewal`, selected member, and membership type
- **Definition of Done:**
  - Implementation is completed for the horizontal stepper and card-based single-step form presentation
  - Relevant UI tests and validation coverage are updated for the refreshed layout without changing existing form behavior expectations
  - Visual and interaction behaviour are verified across supported responsive and touch-friendly screen sizes
- **Dependencies:** PBI-014, PBI-015, PBI-016, PBI-017, PBI-021, PBI-022
- **Systems Affected:** frontend
- **Risk Level:** Medium
- **Estimated Effort:** M

## PBI-024: Membership Form Signature Capture

- **Status:** DONE
- **Goal:** Add a signature capture field to the existing golf club membership form so applicants must provide a handwritten signature before final submission.
- **Scope:**
  - Add a signature input area to the existing membership form flow, aligned with the current completion/consent experience
  - Use a React-compatible signature pad library such as `react-signature-canvas`
  - Support drawing with mouse input on desktop and touch input on tablet
  - Add label text: `Please sign to confirm your membership`
  - Add a `Clear` button that resets the captured signature and allows re-entry
  - Match the existing form design, styling, spacing, and component layout patterns already used in the refreshed multi-step form
  - Capture the signature as an image in base64 format
  - Include the signature image data in the existing form submission payload
  - Validate that a signature is present before allowing final submission
  - Keep the implementation aligned with the current React context, form state, and submission flow patterns
- **Out of Scope:**
  - Any new database schema or storage mechanism beyond the existing form submission flow
  - Any redesign of the broader membership form layout, stepper, or navigation
  - Any handwritten signature verification, audit workflow, or legal compliance workflow beyond required capture
  - Any changes to unrelated form fields, validation rules, or membership business logic
- **Acceptance Criteria:**
  - The signature box renders correctly within the existing membership form UI on desktop and tablet layouts
  - Users can draw a signature using mouse on desktop and touch on tablet
  - Users can clear the signature and re-enter a new one without refreshing the form
  - The form cannot be submitted while the signature field is empty
  - A clear validation message or blocked submit state is shown using existing form UX patterns when no signature is provided
  - The captured signature is converted to base64 image data and included in the submitted form payload
  - The signature field, label, and clear action are visually consistent with the current form styling and component patterns
- **Dependencies:** PBI-023
- **Systems Affected:** frontend, backend
- **Risk Level:** Medium
- **Estimated Effort:** M

## PBI-025: Membership Form Operator Attribution

- **Status:** DONE
- **Goal:** Track the authenticated staff/admin operator who unlocked the shared device with their PIN, carry that operator identity through the full membership form flow, and include it in the submitted form payload without displaying the operator anywhere in the form UI.
- **Scope:**
  - Derive the operator from the currently authenticated shared-device session established after successful PIN entry
  - Capture the operator identity at membership form flow start using the same session/auth source already used by the app for shared-device access
  - Persist the operator identity through the full multi-step membership form journey using the existing form context/state patterns
  - Include the operator identity in the final membership form submission payload using the existing payload-construction pattern
  - Keep the operator identity available through the full form journey without displaying it in any form step, confirmation screen, or completion UI
  - Keep the tracked operator distinct from all member/applicant identity fields and renewal member selection data
  - Preserve the existing membership form UX and navigation patterns while adding the operator attribution
- **Out of Scope:**
  - Any change to member identity capture, member account ownership, or applicant-facing personal details
  - Any new PIN flow, user-selection flow, or authentication model beyond reading the already-authenticated operator session
  - Any staff/admin reassignment flow mid-form, impersonation flow, or manual operator override UI
  - Any schema redesign or unrelated changes to form steps, validation rules, or submission business logic
- **Acceptance Criteria:**
  - When a staff/admin user unlocks the shared device with their PIN and starts a membership form, that same authenticated user is captured as the operator for the form session
  - The operator identity remains available across all form steps and is not lost during normal step navigation within the existing form flow, while remaining hidden from all form-step, confirmation, and completion UI
  - The operator identity is sourced from the shared-device authenticated user whose PIN was entered, not from any member/applicant data entered in the form
  - The submitted membership form payload includes the operator identity using the same context-to-payload flow used for the rest of the form data, and the operator attribution is not displayed anywhere in the form UI
  - Existing membership form UX patterns, step navigation, and validation behaviour remain unchanged apart from the added operator attribution
  - If no valid authenticated operator session is present, the membership form flow does not proceed in a way that would allow a submission without operator attribution
- **Dependencies:** PBI-003b, PBI-014, PBI-023, PBI-024
- **Systems Affected:** frontend, backend
- **Risk Level:** Medium
- **Estimated Effort:** S

## PBI-026: Hide Sign-Off Header Within Membership Flow Screens

- **Status:** DONE
- **Goal:** Remove the existing sign-off header/button from membership-flow screens so the user stays in a focused, uninterrupted flow, while keeping the same sign-off control available on general dashboard screens outside that flow.
- **Scope:**
  - Update the existing authenticated layout/header visibility behavior so the sign-off header/button is hidden when the current screen is part of the membership flow
  - Apply this behavior to the existing `Choose a Membership` screen (`/dashboard/membership-registration`)
  - Apply this behavior to the existing `choosing the form` screen
  - Apply this behavior to the existing `choosing the membership type` screen
  - Apply this behavior to the existing multi-step membership form screens
  - Keep the sign-off header/button visible on dashboard screens that are not part of the membership flow
  - Preserve existing sign-off behavior and session-clearing behavior where the control remains visible
  - Keep the change limited to UI/layout/routing-context behavior only
- **Out of Scope:**
  - Any change to authentication, PIN validation, session creation, inactivity timeout, or sign-off server-side logic
  - Any redesign of the membership flow pages beyond removing the sign-off header/button in the specified contexts
  - Any change to dashboard information architecture, membership-flow business logic, or route access control
- **Acceptance Criteria:**
  - On the `Choose a Membership` screen (`/dashboard/membership-registration`), the sign-off header/button is not rendered
  - On the `choosing the form` screen, the sign-off header/button is not rendered
  - On the `choosing the membership type` screen, the sign-off header/button is not rendered
  - On all steps of the existing multi-step membership form, the sign-off header/button is not rendered
  - On general dashboard screens outside the membership flow, the sign-off header/button remains rendered and usable
  - The visibility rule is determined by the user being inside the membership flow context, not by changes to authentication state
  - Existing sign-off behavior continues to work unchanged everywhere the sign-off control remains available
  - No membership-flow screen shows the sign-off header/button during normal navigation through that flow
- **Dependencies:** PBI-003d, PBI-011, PBI-020, PBI-023
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S
---

## PBI-027: Dashboard Sidebar Navigation Redesign

- **Status:** READY
- **Goal:** Update the left-hand dashboard sidebar to a clean, modern vertical navigation menu with collapsible submenu support, consistent branding, and clear active states.
- **Scope:**
  - Update `components/DashboardSidebar.tsx` (or equivalent sidebar component)
  - Display "Baffy" as the app brand name at the top of the sidebar
  - Menu items in order:
    - Dashboard
    - Accounts
    - Membership (collapsible parent)
      - Pending (submenu item, indented)
      - Member List (submenu item, indented)
  - Membership item is NOT a navigation link — clicking it only toggles expand/collapse of the submenu; it does not navigate to any route
  - Only one section expanded at a time (if additional collapsible sections are added in future)
  - Active/selected menu item is highlighted (light grey background, rounded corners)
  - Hover states on all items (subtle background, rounded corners)
  - Submenu items slightly smaller font size and visually indented to show hierarchy
  - Optional icons to the left of each top-level menu item, consistent with existing design system
  - Smooth expand/collapse animation on submenu
  - Styling uses existing app colour palette: `#f5f6f5` background, `#2b2b2b` text, `#eeeeee` borders
  - Works on desktop and tablet widths
- **Out of Scope:** Mobile hamburger menu, adding new routes, changing existing page behaviour, auth or middleware changes
- **Acceptance Criteria:**
  - Sidebar shows "Baffy" branding at the top
  - Menu items render in order: Dashboard, Accounts, Membership
  - Clicking Membership only toggles the submenu (Pending, Member List) — it does not navigate to any route
  - Active route is clearly highlighted with a light grey background and rounded corners
  - All hover states are visible and consistent
  - Submenu items are indented and slightly smaller than top-level items
  - No regression in existing navigation routes or behaviour
  - Styling matches existing app design system (colours, spacing, typography)
  - All existing tests pass; at least one new test covers expand/collapse behaviour
- **Dependencies:** PBI-026 (merged — Baffy branding established)
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** M

---

## PBI-028: Dashboard Sidebar Navigation Redesign

- **Status:** DONE
- **Goal:** Update the dashboard sidebar to a clean, modern vertical navigation design with Baffy branding at the top, and rename existing menu items.
- **Scope:**
  - Rename "Submissions" menu item to "Pending"
  - Rename "Members" menu item to "Member List"
  - Add "Baffy" app name/brand at the top of the sidebar (above nav items)
  - Remove the full-width header above the sidebar in the dashboard layout — Baffy branding lives only in the sidebar
  - Add "Dashboard" and "Accounts" as menu items in the navigation
  - Clean, modern vertical sidebar layout:
    - Subtle background highlight for active/selected item
    - Rounded corners on hover/active states
    - Consistent spacing between items
    - Optional icons to the left of menu items aligned with existing design
    - Visually consistent with existing app colours and spacing (`#f5f6f5`, `#2b2b2b`, `#eeeeee`)
  - Works well on desktop and tablet
  - Smooth hover states, simple uncluttered layout
- **Out of Scope:** Collapsible submenus, new routes or pages, any backend changes
- **Acceptance Criteria:**
  - "Submissions" is renamed to "Pending" in the sidebar
  - "Members" is renamed to "Member List" in the sidebar
  - "Baffy" brand name appears at the top of the sidebar
  - No separate header bar above the sidebar — the sidebar and content area span the full height of the viewport
  - "Dashboard" and "Accounts" menu items are present
  - Active state is clearly visible on the selected item
  - Hover states are clean and consistent
  - Styling matches existing app design system
  - No regression in current navigation behaviour
  - All existing tests pass
- **Dependencies:** PBI-026 (Baffy branding — DONE)
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-029: Save Membership Form Submission to Database

- **Status:** DONE
- **Goal:** When the membership form is completed, persist the full form payload to a new `membership_pending` database table with account provisioning states set to `pending`.
- **Scope:**
  - Create a new Supabase table `membership_pending` with the following columns:
    - `id` (uuid, PK, default gen_random_uuid())
    - `payload` (jsonb, not null) — the full membership form JSON payload
    - `golfireland_account` (text, not null, default `'pending'`)
    - `brs_account` (text, not null, default `'pending'`)
    - `clubv1_account` (text, not null, default `'pending'`)
    - `submitted_at` (timestamptz, not null, default now())
    - `created_at` (timestamptz, not null, default now())
  - RLS enabled; no client-side reads or writes — all via service role
  - On form completion (when the "Complete" button is clicked in FormShell), send the payload to a new server action or API route that:
    - Inserts a row into `membership_pending`
    - Sets `golfireland_account`, `brs_account`, `clubv1_account` to `'pending'`
    - Stores the full form JSON in `payload`
  - On successful insert, show a confirmation state to the user (e.g. success screen or message)
  - On failure, surface an error state without losing the form data
- **Out of Scope:** Account provisioning logic, external API integrations, admin review UI, status transitions beyond `pending`
- **Acceptance Criteria:**
  - `membership_pending` table exists in Supabase with the defined schema
  - Completing the membership form inserts a row into `membership_pending`
  - `golfireland_account`, `brs_account`, `clubv1_account` are all set to `'pending'` on insert
  - Full form JSON payload is stored in the `payload` column
  - Successful submission shows a confirmation to the user
  - Failed submission shows an error without losing data
  - No client-side direct DB access — insert happens server-side via service role
  - All existing tests continue to pass
- **Dependencies:** PBI-023 (Membership Form — DONE), PBI-025 (Operator Attribution — DONE)
- **Systems Affected:** frontend, supabase
- **Risk Level:** Medium
- **Estimated Effort:** M
- **Note:** Supabase Specialist required for schema; Coder required for server action and form wiring

---

## PBI-030: Membership Form Submission UX — Loading, Success, and Error States

- **Status:** DONE
- **Goal:** On form completion, animate the submission into a grey blind success sequence that shrinks to a checked circle, morphs into a grey success card, then reveals the final member and membership summary below — or return the user to their fully-populated form with an inline error on failure.
- **Scope:**
  - On "Complete" button click in FormShell:
    - Stepper animates all steps to green (completing state — already partially supported)
  - On successful database insert (PBI-029):
    - Grey overlay/blind descends from the top of the page and fully covers the form shell
    - Blind shrinks into a small grey circle with a drawn white checkmark/tick
    - Circle morphs into a persistent grey success card
    - Final success view keeps the grey card visible and reveals the member and membership summary panel below it
    - Success view includes the email follow-up copy and a return path back to membership registration
  - On failure:
    - Restore the stepper in its pre-submission state
    - Return the user to the form at the step they were on, fully populated — no data loss
    - Show an inline error message indicating submission failed with a prompt to try again
  - All transitions happen within the form shell — no full page navigations during submission flow
- **Out of Scope:** Actual email sending, retry logic beyond returning to the form, partial save/draft functionality
- **Acceptance Criteria:**
  - Clicking "Complete" triggers the submission completion state in the form shell
  - Successful submission animates a grey blind from the top of the page, fully covering the form shell
  - The blind shrinks into a grey circle and draws a white checkmark
  - The checked circle morphs into a grey success card
  - The final success view preserves the grey success card and shows the member and membership summary below it
  - Success view includes email follow-up copy and a return path back to membership registration
  - Failed submission returns to the form with all fields still populated and stepper restored
  - An error message is shown on failure
  - No form data is lost on error
  - Loading, success, and error states are visually consistent with the app design system
- **Dependencies:** PBI-029 (Save to database — READY)
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** M

---

## PBI-031: Members Page UI — Members Management Screen

- **Status:** DONE
- **Goal:** Ship the members management screen on `/dashboard/members` with the current table layout, toolbar controls, row actions, missing-info indicator, and modal interactions using page-level mock member data.
- **Scope:**
  - Build the members management screen at `/dashboard/members`
  - Include the current members table columns exactly as shipped: `Member ID`, `Member`, `Membership Type`, `Status`, `Renewal`, `Email`, `Phone Number`, `Home Club`, `Other Clubs`, and `Actions`
  - Add the current toolbar above the table with a `Search members` input, a membership-type filter, and a status filter
  - Include the current row actions: view details, emergency information (`SOS`), and status action (`Disable` for active members, `Enable` for resigned members)
  - Display the missing-info indicator at the end of a row when member details are incomplete, including the current tooltip treatment
  - Provide the current member-status confirmation modal for enable/disable actions
  - Provide the emergency-info modal populated from safeguarding-shaped mock data, including emergency contact and related safeguarding details
  - Keep the existing clean light-surface table styling, hover state, spacing, typography, and responsive horizontal scroll behaviour
  - Use page-level mock/sample member data for this UI delivery
- **Out of Scope:** Real database wiring, persistence for status changes, redesign of the current members layout or interactions, pagination, sorting, or unrelated dashboard changes
- **Acceptance Criteria:**
  - The members page renders the shipped members management screen on `/dashboard/members`
  - The table shows the current shipped columns: `Member ID`, `Member`, `Membership Type`, `Status`, `Renewal`, `Email`, `Phone Number`, `Home Club`, `Other Clubs`, and `Actions`
  - The toolbar includes a search input plus membership-type and status filters
  - Each row includes the current action set: view details, `SOS` emergency information, and the context-appropriate enable/disable status action
  - Rows with incomplete details show the missing-info indicator with the current tooltip treatment
  - Triggering an enable/disable action opens the current confirmation modal
  - Triggering the `SOS` action opens the emergency-info modal populated with safeguarding-shaped mock data
  - The screen remains a UI-only delivery backed by page-level mock data
- **Dependencies:** PBI-005 (Admin dashboard layout — DONE), PBI-028 (Dashboard sidebar redesign — DONE)
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-032: Members Page — Real Data Wiring

- **Status:** DONE
- **Goal:** Replace the page-level mock data behind the shipped members management screen with real database-backed data, including the minimum schema/storage work required so the SOS emergency modal reads from durable member data instead of mock values, while preserving the current table columns, toolbar, row actions, missing-info indicator, status confirmation modal, and SOS emergency modal UX from PBI-031.
- **Scope:**
  - Replace the page-level mock member data on `/dashboard/members` with real database-backed data
  - Preserve the current shipped columns, toolbar, row actions, missing-info indicator, status confirmation modal, and SOS emergency modal UX
  - Preserve the current shipped members table columns: `Member ID`, `Member`, `Membership Type`, `Status`, `Renewal`, `Email`, `Phone Number`, `Home Club`, `Other Clubs`, and `Actions`
  - Preserve the current toolbar UX: `Search members`, membership-type filter, and status filter
  - Preserve the current row actions and modal interactions: view details, `SOS` emergency information, and enable/disable status actions with the existing confirmation modal UX
  - Populate the shipped table columns with real values sourced from the existing data model
  - Add the minimum member-schema fields required to store the emergency/safeguarding data used by the SOS emergency modal
  - Wire the members page so the SOS emergency modal reads emergency/safeguarding data from the durable members data model rather than mock values
  - Derive the missing-info indicator from real completeness rules and real member data rather than a hard-coded mock flag
  - Add or update only the required read-side data-fetching and mapping path needed to supply the members page with real data
  - Limit this PBI to the minimum schema addition required to support the existing shipped UI
  - Keep the current layout, styling, and interactions unchanged
  - Do not guess new write paths as part of this PBI
- **Out of Scope:** Any redesign of the members page, changes to the shipped interactions or layout, broader schema redesign, unrelated schema changes, guessed new write-path implementation, or broader member-management workflows beyond wiring the existing UI to real data and adding the minimum SOS data fields it already depends on
- **Acceptance Criteria:**
  - The members page no longer relies on page-level mock data for the shipped members management screen
  - The current shipped table columns are populated with real database-backed values
  - The SOS emergency modal displays real member-linked emergency/safeguarding data from the durable members data model
  - The minimum required schema/storage fields for the SOS emergency data are in place
  - The missing-info indicator is derived from real completeness rules and real member data
  - The current shipped UX remains unchanged
  - Required read-side backend/server/data-fetching work is in place to supply the shipped members UI with real data without introducing broader schema redesign, unrelated schema changes, or guessed new write paths
- **Dependencies:** PBI-031 (Members management screen UI — DONE), PBI-029 (Save membership form submission to database — DONE)
- **Systems Affected:** frontend, backend
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-033: Accounts Page UI — Accounts Table

- **Status:** DONE
- **Goal:** Add a UI table to the accounts page with a clean, modern presentation that matches the current dashboard table refresh work.
- **Scope:**
  - Add an accounts table to the accounts page
  - Table columns are exactly:
    - `Name`
    - `Email`
    - `Status`
    - `Role`
    - `Permissions`
    - `Edit`
  - The `Edit` column displays a row-level edit icon or icon button on each row, with no additional text content in the table cells
  - Use mock or sample account data if needed for the UI implementation
  - Keep the implementation limited to the UI layer only with no backend or real data wiring
  - Table styling should match the existing table PBIs and current UI refresh work:
    - clean, modern table design
    - light background
    - subtle row borders
    - slightly bolder header row
    - row hover state
    - consistent spacing and alignment
    - responsive layout with horizontal scroll on smaller screens if needed
    - consistent palette, spacing, and typography with the existing app UI
    - minimal styling
- **Out of Scope:** Any backend or database work, real data wiring, edit form behavior, save/update functionality, filtering, sorting, pagination, or redesign of unrelated dashboard screens
- **Acceptance Criteria:**
  - The accounts page displays an accounts table UI
  - The table columns are exactly `Name`, `Email`, `Status`, `Role`, `Permissions`, and `Edit`
  - Each table row shows a row-level edit icon or icon button under the `Edit` column with no additional text content in that cell
  - The table uses a clean, modern light design with subtle row borders, slightly bolder headers, consistent spacing/alignment, and a visible row hover state
  - The table remains readable on smaller screens and allows horizontal scrolling where needed
  - The styling remains consistent with the current app palette, spacing, typography, and broader UI refresh work
  - The change is limited to the accounts page UI layer only and may use mock/sample account data
- **Dependencies:** PBI-005 (Admin dashboard layout — DONE), PBI-028 (Dashboard sidebar redesign — DONE)
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-034: Accounts Page Table — Profiles Data Wiring And Permissions Schema

- **Status:** READY
- **Goal:** Follow up PBI-033 by wiring the accounts page table to real database-backed account data sourced primarily from the `profiles` table, and update the profiles schema so permissions are stored on each profile record.
- **Scope:**
  - Replace the mock/sample accounts page table data introduced in PBI-033 with real database-backed data
  - Source account rows for the accounts page primarily from the `profiles` table
  - Update the `profiles` table schema so permissions data is stored on each profile record
  - Supply the accounts page with real values for the columns:
    - `Name`
    - `Email`
    - `Status`
    - `Role`
    - `Permissions`
  - Preserve the table UI, column layout, and row-level edit-icon column design introduced in PBI-033
  - Add or update the required server-side data-fetching path needed to supply the accounts page with real account/profile rows
  - Where `Email` is not stored directly on the profile record, implementation may use any required safe server-side lookup or join to supply email alongside profile-backed account rows while keeping `profiles` as the primary source for account records
  - Keep the `Edit` column limited to UI presentation only for this PBI unless a minimal supporting change is required to preserve the existing table rendering
- **Out of Scope:** Any redesign of the accounts table UI, any change to edit interactions or edit workflows, unrelated schema redesign, filtering, sorting, pagination, or unrelated dashboard changes
- **Acceptance Criteria:**
  - The accounts page no longer relies on mock/sample data for the accounts table
  - Accounts rows are populated from real database-backed account/profile data
  - The accounts page shows real values for `Name`, `Email`, `Status`, `Role`, and `Permissions`
  - Permissions are stored on profile records in the database
  - The table design and edit-icon presentation introduced in PBI-033 remain unchanged after data wiring
- **Dependencies:** PBI-033 (Accounts Page UI — Accounts Table — READY), PBI-002 (Profiles table and role support — DONE)
- **Systems Affected:** frontend, backend, supabase
- **Risk Level:** Medium
- **Estimated Effort:** M
- **Note:** Supabase Specialist Required

## PBI-035: Dashboard And Membership Flow Scroll Containment Fixes

- **Status:** DONE
- **Goal:** Tighten scroll containment across the dashboard members/accounts screens and the membership flow so page chrome stays fixed, only the intended content regions scroll, and the membership form/success surfaces render cleanly to the viewport bottom.
- **Scope:**
  - Contain dashboard shell/page scrolling correctly for the members and accounts screens
  - On the members page, keep vertical scrolling limited to the table area only
  - On the accounts page, keep the page chrome fixed, limit vertical scrolling to the table area, and remove horizontal table scrolling
  - Ensure the white middle section of the membership form extends to the bottom of the viewport without the outer grey background showing below it
  - Keep the top-left close (`X`) control visible on the membership success confirmation while the summary content scrolls
- **Out of Scope:** Any new data wiring, table redesign, membership form business-logic changes, success-state copy changes, or unrelated dashboard layout changes
- **Acceptance Criteria:**
  - The members page does not scroll at the page level during normal table interaction; only the table region scrolls vertically
  - The accounts page keeps its surrounding page chrome fixed while the table region scrolls vertically
  - The accounts table does not introduce horizontal scrolling in the shipped dashboard layout
  - The membership form white middle section visually reaches the bottom of the viewport without exposing outer grey below it
  - The membership success confirmation keeps the top-left `X` button visible while the summary area scrolls
  - Existing members, accounts, and membership-flow UI behaviour remains otherwise unchanged
- **Dependencies:** PBI-030, PBI-032, PBI-033
- **Systems Affected:** frontend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-036: HICKORY Branding Overhaul And Repository Rename Sweep

- **Status:** DONE
- **Goal:** Replace the current Baffy/Baffie brand identity with HICKORY across the app and repository, delivering production-ready core brand assets and removing obsolete brand-specific files without breaking existing product behaviour.
- **Scope:**
  - Rename tracked files whose filenames contain `baffy` or `baffie` to `hickory`
  - Update imports, references, asset paths, and tests required by those file renames
  - Remove superseded brand-specific files once replacements exist and no active references remain
  - Create a reusable HICKORY wordmark asset for the app name using Cormorant Garamond SemiBold, or Medium if that gives better balance
  - Set the wordmark to all caps `HICKORY` with `0.18em` letter spacing
  - Keep the wordmark minimal and timeless with no shadows, gradients, effects, or background
  - Use wordmark colour `#1E2A26`
  - Create a separate vintage hickory golf club head icon in a minimal engraved style
  - Use warm metallic icon colour `#B08D57` or `#8C6A43`
  - Deliver horizontal and vertical lockups with `12px` to `18px` spacing between icon and wordmark
  - Replace existing in-app Baffy/Baffie brand surfaces with the approved HICKORY assets
  - Ensure the new branding remains readable on both light and dark UI backgrounds
- **Out of Scope:** Net-new product flows, unrelated layout redesign, non-brand copy rewrite beyond direct brand references, marketing-site work, or print collateral
- **Acceptance Criteria:**
  - No tracked runtime file names in the repo contain `baffy` or `baffie` after the rename sweep
  - All imports and references affected by renamed files are updated and the touched app areas still run as expected
  - Obsolete brand-specific files replaced by HICKORY assets are removed from active use and deleted when no longer needed
  - A production-ready HICKORY wordmark asset exists and matches the required spec: all caps, Cormorant Garamond SemiBold or Medium, `0.18em` letter spacing, minimal/timeless styling, no shadows/gradients/effects/background, colour `#1E2A26`
  - A separate vintage hickory golf club head icon asset exists in a minimal engraved style using either `#B08D57` or `#8C6A43`
  - Horizontal and vertical lockups exist with `12px` to `18px` spacing and are ready for app use
  - Existing app brand surfaces no longer show Baffy or Baffie and instead show HICKORY using the new approved assets
  - The delivered wordmark remains legible on both light and dark UI backgrounds
  - A branded splash/intro page exists at the app root (`/`) that displays the HICKORY wordmark centred and large on load, animates it to the top-left corner, then redirects to `/select-user`
- **Dependencies:** None
- **Systems Affected:** frontend, backend, tests
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-037: Requests Management Page

- **Status:** DONE
- **Goal:** Replace the current `Pending` dashboard menu/page with a real `Requests` management screen that follows existing dashboard patterns and gives admins clear, searchable request status tracking.
- **Scope:**
  - Rename the existing `Pending` dashboard menu item and page surface to `Requests`
  - Update the route from `/dashboard/submissions` to `/dashboard/requests` and update all internal references
  - Replace the current placeholder submissions/pending page with a real Requests management page
  - Follow existing dashboard layout and table patterns where practical
  - Add a top row with:
    - a left-aligned search input with placeholder `Search requests…`
    - a right-aligned status dropdown with `All`, `Pending`, `In Progress`, and `Completed`, with `Pending` selected by default
    - a year filter dropdown
  - Add a table with columns exactly:
    - selection checkbox
    - `Request`
    - `Requester`
    - `Intent`
    - `Submitted Date`
    - `Status`
    - `STEP`
    - action button
  - Add rounded status chips using:
    - `Pending` = yellow
    - `In Progress` = blue
    - `Completed` = green
  - Add horizontally grouped step chips labeled `1`, `2`, `3`, sized to allow an optional small icon
  - Support step-chip states:
    - completed/active = green
    - in progress = blue
    - pending = yellow
    - failed = red
  - Support an optional warning/error icon in the failed step state
  - Add tooltips to each step chip (1, 2, 3) with integration names:
    - Step 1: 'Golf Ireland'
    - Step 2: 'BRS'
    - Step 3: 'ClubV1'
  - Use the same tooltip style as other dashboard pages
  - Implement client-side filtering by the selected status and year
  - Implement search across `Request`, `ID`, and `Requester`
  - Include pagination controls and a bottom selection drawer when visible rows are selected
  - Keep the design clean and admin-focused with minimal borders, soft row separation, consistent spacing/alignment, prominent rounded chips, and responsive small-screen handling
- **Out of Scope:** New request-submission flows, edits to the membership form itself, new provisioning business logic, export, or unrelated dashboard redesign
- **Acceptance Criteria:**
  - The dashboard no longer shows `Pending`; it shows `Requests`
  - The page title is `Requests`
  - The old placeholder page is replaced by a real admin-style requests table screen
  - The top row renders a search input with placeholder `Search requests…`, a status dropdown with `All`, `Pending`, `In Progress`, and `Completed`, and a year filter dropdown, with `Pending` active by default
  - Changing the status dropdown filters the visible rows accordingly
  - The table columns are exactly selection checkbox, `Request`, `Requester`, `Intent`, `Submitted Date`, `Status`, `STEP`, and an action button
  - Each row renders a rounded status chip using the specified colour mapping
  - Each row renders three horizontally grouped step chips labeled `1`, `2`, and `3`, with the specified visual states and optional failed-state warning/error icon support
  - Each step chip (1, 2, 3) displays a tooltip showing the corresponding integration name (Golf Ireland, BRS, ClubV1 respectively)
  - Search filters rows by matches in `Request`, `ID`, or `Requester`
  - The page includes pagination controls, and selecting visible rows reveals a bottom selection drawer
  - The page remains usable on smaller screens via horizontal scrolling or an equivalent responsive treatment
  - The final UI is consistent with the current dashboard look and feels like a clean SaaS admin table page
- **Dependencies:** PBI-028 (Dashboard sidebar redesign — DONE), PBI-029 (Save membership form submission to database — DONE), PBI-030 (Membership form submission UX states — DONE)
- **Systems Affected:** frontend, backend
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-038: Requests Workflow Backend — Data Model & Form Wiring

- **Status:** TESTING
- **Goal:** Establish the backend data model and data wiring for the Requests management workflow, replacing "Pending" terminology with "Requests", connecting form submissions to a membership_requests table, and enabling the requests management page (PBI-037) to read live request and provisioning-step data.
- **Scope:**
  - **Rename & Module Update:** Rename all backend terminology, variable names, function names, and internal references from `pending` or `submissions` to `requests`. Update any existing backend utilities, helpers, services, or constants that reference the old terminology.
  - **Form Submission Update:** Update the membership form completion flow (PBI-030) to write submissions to a `membership_requests` table (or equivalent live requests data source) instead of the existing `membership_pending` table or any placeholder. Ensure form submission payloads are persisted with a `request_id` or equivalent unique identifier. Capture and store the authenticated operator (staff/admin user) who submitted the form as part of the request record.
  - **Data Model / Backend Structure:** Create or update the `membership_requests` table with: `id` (uuid, PK, default gen_random_uuid()); `payload` (jsonb, not null) — full membership form JSON payload; `request_type` (text, not null) — e.g. `'new_member'` or `'renewal'`; `operator_id` (uuid, not null, FK → profiles.id) — authenticated operator who submitted; `requester_name` (text, not null) — derived from payload; `requester_email` (text, not null) — derived from payload; `status` (text, not null, default `'pending'`, CHECK IN ('pending', 'in_progress', 'completed')) — overall request status; `golfireland_account` (text, not null, default `'pending'`) — Golf Ireland step status; `brs_account` (text, not null, default `'pending'`) — BRS step status; `clubv1_account` (text, not null, default `'pending'`) — ClubV1 step status; `membership_status` (text, not null) — derived from payload; `submitted_at` (timestamptz, not null, default now()); `created_at` (timestamptz, not null, default now()); `updated_at` (timestamptz, not null, default now()). Enable RLS with service-role-only access. Add an `updated_at` trigger.
  - **Table Data Wiring:** Create a server-side data-fetching function that queries the `membership_requests` table using the service role, returns the request data required by the Requests page, orders results by `submitted_at DESC`, and limits access to authenticated admin users only. Search and status/year filtering remain handled client-side in the Requests page UI.
  - **Status Logic Mapping:** Define a mapping from provisioning-step states (`pending`, `in_progress`, `completed`, `failed`) to visual states (yellow, blue, green, red respectively) and from the request overall `status` field to the Requests page status chip. Add a computed field or helper function that derives the request's overall status from its provisioning steps if needed.
  - **UI Integration Requirements:** Ensure the data-fetching function returns fields in a format that PBI-037 (Requests page) can directly use. Support null/undefined handling. Provide timestamp formatting for the request row data, including submitted date display. Ensure the operator lookup is efficient and does not introduce N+1 queries.
- **Out of Scope:** Any UI redesign or routing changes related to the Requests page (handled by PBI-037), account provisioning workflows or automation, new write paths for updating request statuses or provisioning states, bulk actions, exporting, or advanced admin workflows on requests, membership form redesign or new form fields
- **Acceptance Criteria:**
  - The `membership_requests` table exists with the defined schema and constraints
  - Form submission (PBI-030) writes to the `membership_requests` table with all required fields populated
  - The operator (authenticated staff/admin user) is correctly captured and stored in `operator_id`
  - A server-side data-fetching function exists that queries the `membership_requests` table, returns all fields required by the Requests page, orders results by submitted date (most recent first), and enforces authentication/authorization for admin users only
  - Search and status/year filtering for the Requests page are handled client-side in the Requests page UI
  - Status and step-state mappings are defined and implemented correctly
  - All rows retrieved from the membership_requests table can be displayed by the Requests page without additional data transformation
  - Existing form submission tests continue to pass with the new `membership_requests` table destination
  - No N+1 query problems when fetching requests with operator data
- **Dependencies:** PBI-029 (Save membership form submission to database — DONE), PBI-030 (Membership form submission UX states — DONE), PBI-025 (Membership form operator attribution — DONE), PBI-037 (Requests Management Page UI — DONE)
- **Systems Affected:** backend, supabase
- **Risk Level:** Medium
- **Estimated Effort:** M
- **Note:** Supabase Specialist Required for schema creation, RLS policies, and timestamp trigger. Coder required for form wiring, data-fetching function, and status mapping logic.

---

## PBI-039: Requests Sidebar Pending Count Badge

- **Status:** READY
- **Goal:** Add a small pending-count badge to the Requests sidebar menu item so admins can immediately see when there are outstanding pending requests without opening the Requests page.
- **Scope:**
  - Add a small circular number chip/badge to the `Requests` dashboard sidebar menu item
  - Show no badge when the number of pending requests is `0`
  - Show the badge only when the number of pending requests is greater than `0`
  - Drive the badge from the live pending request count sourced from `membership_requests`
  - Keep the badge styling consistent with the current dashboard/sidebar visual language
  - Ensure the badge remains readable at small sizes and handles multi-digit counts gracefully
  - Update the sidebar data wiring needed to fetch and render the pending request count efficiently
- **Out of Scope:** Changes to Requests table behaviour, request processing logic, queue/worker logic, or broader sidebar redesign
- **Acceptance Criteria:**
  - The `Requests` sidebar item shows no badge when there are `0` pending requests
  - The `Requests` sidebar item shows a small circular number badge when there is at least `1` pending request
  - The badge count reflects the live number of pending requests from `membership_requests`
  - The badge styling is visually consistent with the existing dashboard sidebar
  - The badge remains legible for multi-digit counts
- **Dependencies:** PBI-037 (Requests Management Page — DONE), PBI-038 (Requests Workflow Backend — Data Model & Form Wiring — TESTING)
- **Systems Affected:** frontend, backend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-040: Queue Infrastructure & Request Auto-Enqueue

- **Status:** READY
- **Goal:** Establish a Supabase queue table with Row Level Security, an auto-trigger that enqueues membership requests when they are created, and a basic dequeue pattern for background workers.
- **Scope:**
  - Create a new Supabase table `integration_queue` with columns: `id` (uuid, PK, default gen_random_uuid()); `request_id` (uuid, not null, FK → membership_requests.id ON DELETE CASCADE); `status` (text, not null, CHECK IN ('pending', 'processing', 'completed', 'dead_letter'), default `'pending'`); `attempt_count` (int, not null, default 0); `max_attempts` (int, not null, default 5); `next_retry_at` (timestamptz, nullable); `last_error` (text, nullable); `last_error_at` (timestamptz, nullable); `locked_at` (timestamptz, nullable); `locked_by_worker` (text, nullable); `metadata` (jsonb, nullable); `created_at` (timestamptz, not null, default now()); `updated_at` (timestamptz, not null, default now()).
  - Enable RLS on `integration_queue` with policies: service role can SELECT, INSERT, UPDATE, DELETE; anon key and client users cannot access.
  - Create a Supabase trigger on `membership_requests` that automatically inserts a row into `integration_queue` when a new request is created with `status = 'pending'`, `attempt_count = 0`, `max_attempts = 5`.
  - Add an `updated_at` trigger on `integration_queue` to update the timestamp on every write.
  - Document the queue table schema and trigger in `/supabase/schema.sql`.
  - Create a basic TypeScript helper function `lib/queue/dequeue.ts` that accepts `batch_size` parameter (default 10), queries pending queue entries with `status = 'pending'` and `(next_retry_at IS NULL OR next_retry_at <= now())`, locks each entry atomically, and returns locked entries with their associated request data.
- **Out of Scope:** Worker service implementation, integration adapter logic, retry calculation or failure state transitions, audit logging, external queue services, worker authentication beyond service role
- **Acceptance Criteria:**
  - `integration_queue` table exists with all defined columns and constraints
  - RLS is enabled and enforces service-role-only access
  - Inserting a row into `membership_requests` automatically creates a corresponding row in `integration_queue`
  - Auto-enqueued row has `status = 'pending'`, `attempt_count = 0`, `max_attempts = 5`
  - `updated_at` trigger fires on insert and update
  - Dequeue helper function exists at `lib/queue/dequeue.ts`
  - `dequeue(batchSize)` returns pending queue entries with request data and sets `locked_at` and `locked_by_worker` atomically
  - `dequeue()` respects `next_retry_at` — entries with future retry dates are not included
  - Locked entries are not included in dequeue results until lock expires or is released
  - Schema is fully documented in `/supabase/schema.sql`
  - Tests verify trigger fires on membership_requests insert and dequeue returns locked entries
- **Dependencies:** PBI-038 (membership_requests table exists)
- **Systems Affected:** supabase, backend, tests
- **Risk Level:** Medium
- **Estimated Effort:** M
- **Note:** Supabase Specialist Required for schema, triggers, and RLS. Coder required for dequeue helper and tests.

---

## PBI-041: Integration Adapter Framework

- **Status:** READY
- **Goal:** Define a pluggable adapter interface that all external integrations must implement, with contract for request input, success/failure output, and idempotency guarantees.
- **Scope:**
  - Create an abstract adapter interface in TypeScript (`lib/integrations/types.ts` or similar) that defines the contract all integrations must satisfy.
  - Interface must include: `name` (string identifier, e.g. "golf_ireland"), `validate(request)` (validates input request payload), `execute(request, context)` (performs the integration action), `cleanup(context)` (optional teardown), and return type `{ success: boolean, externalId?: string, error?: string, metadata?: object }`.
  - Define configuration pattern for storing adapter credentials, endpoints, and environment-specific settings securely.
  - Document idempotency requirements: adapters must handle duplicate execution without creating duplicate external accounts.
  - Create a factory function `createAdapterByName(name)` that instantiates the correct adapter based on configuration.
  - Add TypeScript types for request context, logging, and error handling.
- **Out of Scope:** Implementing specific adapters (e.g. Golf Ireland), worker service integration, credential management, external service APIs
- **Acceptance Criteria:**
  - Adapter interface exists with required methods and return types
  - Interface documentation includes idempotency contract
  - Factory function exists and returns correct adapter instance by name
  - At least one example/mock adapter implementation exists for testing
  - Types are exported and usable by all integration implementations
  - Tests verify factory returns correct adapter and interface contract is enforced
- **Dependencies:** PBI-040 (queue infrastructure)
- **Systems Affected:** backend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-042: Background Worker Service

- **Status:** READY
- **Goal:** Build a Node.js worker process that polls the queue, executes adapters for each request, and handles success and failure with single attempt per entry.
- **Scope:**
  - Create a worker service that runs continuously or as a scheduled job (e.g. every 5-10 seconds).
  - Worker must poll `integration_queue` using the `dequeue()` helper from PBI-040.
  - For each dequeued message: load the associated request payload from `membership_requests`, determine which adapter to use (based on request_type or configuration), instantiate the adapter from PBI-041, call `adapter.execute(request)`, and handle the response.
  - On adapter success: write the returned `externalId` back to the `membership_requests` table, update the corresponding step status (e.g. `golfireland_account = 'completed'`), update queue entry to `status = 'completed'`, log success with externalId.
  - On adapter failure: capture the error, take a screenshot if the adapter provides one, update queue entry with `last_error`, `last_error_at`, and `screenshot_path` (if applicable), mark queue entry as `status = 'failed'`. No retries — single attempt only.
  - Add comprehensive structured logging for all steps: queue entry received, adapter started, adapter form fill, form submission, success/failure, screenshot capture (if applicable), worker completion. All logs must include event_type, adapter_name, external_id (if success), error_message, screenshot_path (if failure), and log_level.
  - Implement graceful shutdown handling (finish in-flight requests, exit cleanly).
  - Worker should run as a background service (PM2, systemd, or equivalent).
- **Out of Scope:** Audit logging (PBI-045), specific adapter implementations (PBI-043+), credential management
- **Acceptance Criteria:**
  - Worker service exists and can be started via `npm run worker` or equivalent
  - Worker polls `integration_queue` in a loop with configurable interval
  - Worker successfully dequeues locked messages and processes them
  - On success, `externalId` is written to `membership_requests`
  - On success, queue entry is marked `completed`
  - On failure, error is captured, queue entry is marked `failed`, and no retry is scheduled
  - All processing steps logged with structured logging (adapter started, field fill, form submit, success/failure, screenshot path)
  - Graceful shutdown is implemented
  - Tests verify worker dequeues, executes adapters, and updates state correctly (with mock adapter)
- **Dependencies:** PBI-040 (queue infrastructure), PBI-041 (adapter framework)
- **Systems Affected:** backend, supabase
- **Risk Level:** Medium
- **Estimated Effort:** M

---

## PBI-043: Golf Ireland Integration Adapter

- **Status:** READY
- **Goal:** Implement a headless browser automation adapter that logs into Golf Ireland, creates a user account, captures the external user ID, and handles failures with screenshots.
- **Scope:**
  - Create an adapter implementation in `lib/integrations/golfireland.ts` that implements the interface from PBI-041.
  - Use Puppeteer, Playwright, or equivalent headless browser automation library.
  - Adapter must: launch a browser instance, navigate to Golf Ireland login page, enter credentials (from secure config), navigate to account creation form, populate form fields from the request payload (mapping required), submit the form, capture the resulting external user/member ID from the response page, and close the browser.
  - Extract the external ID from the resulting page HTML or API response and return it in the adapter result.
  - On form fill or submission failure: capture a screenshot using the browser automation library, save it to a file-based store or cloud storage (e.g. `/tmp/failures/<requestId>_<timestamp>.png`), return the screenshot path in the adapter failure response, and log the screenshot path in error messages.
  - Store screenshot reference in the queue entry metadata or audit trail for admin review.
  - Handle common failure modes: login failure, form validation error, network timeout, missing fields in payload.
  - Add descriptive error messages and screenshot paths.
  - Support both headless and non-headless modes (non-headless for development debugging).
  - Test with a mocked Golf Ireland page or equivalent test environment.
- **Out of Scope:** Golf Ireland API (if available) is preferred, but not required; manual clicking/form automation is acceptable. Worker integration is separate (PBI-042). Credential management is separate. Idempotency checks (single attempt, no duplication concern).
- **Acceptance Criteria:**
  - Golf Ireland adapter exists at `lib/integrations/golfireland.ts`
  - Adapter implements the required interface from PBI-041
  - Adapter successfully launches browser, navigates to Golf Ireland, and fills form fields from request payload
  - Adapter captures external user ID from the resulting page
  - Adapter returns success result with `externalId` populated
  - On failure: adapter captures a screenshot, saves it to file or cloud storage, and returns the screenshot path in the failure response
  - Screenshot path is logged in error messages and stored for admin review
  - Adapter handles failure modes with descriptive error messages and screenshot references
  - Tests verify adapter with mocked Golf Ireland page or test environment
  - Headless and non-headless modes work correctly
- **Dependencies:** PBI-041 (adapter interface), PBI-042 (worker service)
- **Systems Affected:** backend
- **Risk Level:** High (external site dependencies, UI automation fragility, credential handling)
- **Estimated Effort:** M

---

## PBI-044: Failure Handling & Simplification

- **Status:** READY
- **Goal:** Simplify queue failure handling to mark entries as failed immediately with error and screenshot storage, allowing manual retry if needed.
- **Scope:**
  - When an adapter fails, immediately mark the queue entry as `status = 'failed'` (no retries).
  - Store error details in queue entry `last_error` and `last_error_at` (timestamp).
  - Add a new optional field `screenshot_path` to `integration_queue` to store the screenshot reference if one was captured during failure.
  - Admin can view failed requests and their associated errors and screenshots from the Requests admin table.
  - Optionally: add a simple manual retry button in the Requests admin UI (separate future PBI) that allows admins to reset a failed entry to `status = 'pending'` if they manually fix the underlying issue.
  - No exponential backoff, no dead-letter queue, no retry scheduling logic.
- **Out of Scope:** Worker process execution (PBI-042), audit logging (PBI-045), UI for failed request inspection (can be added in future), email alerts, automatic retries
- **Acceptance Criteria:**
  - On adapter failure, queue entry is immediately marked `failed` with no further retry scheduling
  - `last_error` and `last_error_at` are captured on every failure
  - `screenshot_path` field exists and is populated when a screenshot is captured during failure
  - Admins can view failed entries and their errors/screenshots from the Requests table
  - No exponential backoff calculation or dead-letter queue logic is implemented
  - Tests verify queue entry transitions from processing to failed state with error and screenshot captured
- **Dependencies:** PBI-042 (worker must persist error state)
- **Systems Affected:** backend, supabase
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-045: Comprehensive Audit Trail & Structured Logging

- **Status:** READY
- **Goal:** Ensure comprehensive logging throughout the worker and adapter lifecycle, with structured audit events that include error details and screenshot references.
- **Scope:**
  - Add logging at every step in the worker and adapter execution:
    - Queue entry created (enqueued event)
    - Worker polling started
    - Adapter instantiation started
    - Adapter form fill started
    - Form field population (debug-level)
    - Form submission started
    - Form submission completed (success or failure)
    - Screenshot capture (if failure)
    - Worker completion (success or failure)
  - Audit trail captures structured events with:
    - `event_type`: e.g. 'enqueued', 'processing_started', 'adapter_started', 'form_fill_started', 'form_submit_attempted', 'screenshot_captured', 'processing_succeeded', 'processing_failed'
    - `adapter_name`: the name of the adapter being executed
    - `external_id`: populated if success, null otherwise
    - `error_message`: populated if failure, null otherwise
    - `screenshot_path`: populated if a screenshot was captured during failure, null otherwise
    - `log_level`: 'info', 'error', 'debug' as appropriate
  - Worker logs must be structured and visible in application logs (stdout/stderr) for operational visibility.
  - All audit events that occur during a failed request must reference the `screenshot_path` if one was captured.
  - Store audit log data in application logs (and optionally in a database audit table for future UI consumption).
- **Out of Scope:** UI display of audit trail (future PBI), real-time monitoring dashboards, alerting, export/reporting
- **Acceptance Criteria:**
  - All processing steps are logged with structured logging (adapter started, field fill, form submit, success/failure, screenshot path)
  - Logs include event_type, adapter_name, external_id (if success), error_message, screenshot_path (if failure), and log_level
  - Logs are structured and visible in application stdout/stderr
  - Failed requests with screenshots include screenshot_path in log messages
  - Tests verify all key state transitions are logged with correct event types and field values
- **Dependencies:** PBI-042 (worker service), PBI-044 (retry logic)
- **Systems Affected:** supabase, backend
- **Risk Level:** Low
- **Estimated Effort:** S

---

## PBI-046: Development Tools — Replay & Debug Mode

- **Status:** READY
- **Goal:** Add environment-specific verbose logging, message replay capability for local development, and test fixtures for Golf Ireland automation mocking.
- **Scope:**
  - Create an environment variable `WORKER_DEBUG_MODE` that enables verbose logging output (including full request payloads, adapter input/output, browser automation screenshots, etc.).
  - Implement a CLI command `npm run worker:replay <requestId>` that:
    - Fetches a request from the database
    - Looks up its queue entry history from `integration_audit`
    - Re-executes the worker logic with debug logging enabled
    - Allows developers to replay and inspect failed requests locally
  - Create mock/fixture implementations for Golf Ireland that simulate browser automation without hitting the real site (for local testing).
  - Add a `.env.development` template with sensible defaults that enable debug mode and use mock adapters by default.
  - Document the development workflow in a `DEVELOPMENT.md` or similar guide.
- **Out of Scope:** Production performance optimization, production-only monitoring tools, CI/CD integration
- **Acceptance Criteria:**
  - `WORKER_DEBUG_MODE` environment variable can be set to enable verbose logging
  - Debug mode outputs full request payloads, adapter steps, and status transitions
  - `npm run worker:replay <requestId>` command exists and re-executes a request with debug logging
  - Mock Golf Ireland adapter exists and can be used for local testing
  - `.env.development` template includes debug settings and mock adapter references
  - Developer guide documents how to use debug mode and replay
  - Tests verify debug logging is conditional and does not impact production performance
- **Dependencies:** PBI-040, PBI-041, PBI-042 (all worker infrastructure)
- **Systems Affected:** backend, development tools
- **Risk Level:** Low
- **Estimated Effort:** S
