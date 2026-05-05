# SAD — System Architecture Document
**Golf Club Management App — Phase 1 MVP**
_Single source of truth for all implementation decisions._

---

## 1. Project Overview

A web-based Golf Club Management application that allows club admins to manage staff records and allows staff and admins to authenticate on a shared device. Phase 1 delivers PIN-based authentication, role-based access control, an admin dashboard shell, a shared staff/admin membership-registration entry experience, and the foundation for a unified membership flow.

### Delivery Model

Delivery is organised per backlog item rather than through long-running shared branches.

- main is the production branch.
- Each approved PBI is implemented on its own branch.
- Every PBI branch must open a PR into main before the work can be completed.
- The PR is the review surface and the source of the Vercel preview deployment for that PBI.
- Production deployment happens only after the PR is merged into main.

---

## 2. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x — strict mode enabled |
| Styling | Tailwind CSS | 3.x |
| Auth + DB | Supabase | Latest JS client (`@supabase/ssr`) |
| Hosting | Vercel | Supabase Vercel integration for env vars |

**Rationale:**
- Next.js App Router enables server components and server-side session checks without client round-trips.
- Supabase provides Auth and PostgreSQL out of the box, reducing infrastructure overhead.
- Tailwind eliminates custom CSS drift and enforces design consistency.

---

## 3. Architecture

```
Browser
  └── Next.js App Router (Vercel Edge / Node)
        ├── Server Components (read Supabase via server client)
        ├── API Routes (/app/api/*) — server-side mutations
        └── Middleware (Next.js middleware.ts) — session + role checks
              └── Supabase (Auth + PostgreSQL)
                    ├── auth.users (managed by Supabase)
                    └── public.profiles (custom table, linked via user_id)
```

**Key patterns:**
- `@supabase/ssr` — cookie-based session management for App Router.
- Server components fetch data directly from Supabase (no intermediate REST layer needed for reads).
- `middleware.ts` intercepts every request to validate session and enforce role routing.
- The admin dashboard shell exposes a side menu with `Submissions` and `Members`, while the admin dashboard home also exposes quick-access buttons for membership journeys.
- The membership-registration page remains outside the admin dashboard shell so both staff and admin can use the same entry surface for membership flows.
- Membership journeys are converging on a shared flow under protected dashboard routes: choose action, optionally search for an existing member for renewals, choose membership type, then continue into the final form or email path.
- No client-side Supabase calls for sensitive operations.

---

## 4. Core Entities and Data Model

### `auth.users` (managed by Supabase)
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | Unique |
| created_at | timestamptz | Auto |

### `public.profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, references auth.users(id) ON DELETE CASCADE |
| display_name | text | Not null |
| role | text | CHECK (role IN ('staff', 'admin')), not null |
| avatar_url | text | Nullable |
| created_at | timestamptz | Default now() |

**Constraint:** `role` is enforced at the DB level via a CHECK constraint, not only at the app level.

---

## 5. Auth Flow

### Device Model
This application runs as a **shared kiosk device** (tablet/browser). There is no individual Supabase session per staff member. All database reads and writes are performed server-side via Next.js Server Actions using `SUPABASE_SERVICE_ROLE_KEY`. The device holds no per-user Supabase session cookie.

### Active User Cookie
After PIN validation, the server creates a signed `activeUser` cookie using `ACTIVE_USER_SECRET` (symmetric JWT or iron-session). The cookie payload is:

```json
{ "profileId": "uuid", "displayName": "string", "role": "staff|admin", "expiresAt": "ISO8601" }
```

- Cookie is `httpOnly`, `sameSite=strict`, server-signed.
- Expires after **8 hours** (shift duration).
- Cleared on explicit sign-off or inactivity lockout.
- Middleware reads this cookie to identify the active user on every request — no DB call required per request.

### Normal Auth Flow
1. Device shows `/select-user` — a server-rendered grid of all user profile cards (name + avatar), fetched via service role.
2. User taps their card → navigates to `/pin?userId=<profileId>`.
3. User enters 4-digit PIN → Server Action receives `profileId` + `pin`.
4. Server Action fetches `profiles.pin_hash` via service role → `bcrypt.compare()` server-side.
5. **Success:** Server Action sets signed `activeUser` cookie → redirect to `/dashboard`. Middleware routes `admin` to `/dashboard` while also allowing access to `/dashboard/membership-registration`, and routes `staff` to `/dashboard/membership-registration`.
6. **Failure:** Server Action increments `pin_fail_count` on the profile row. After 5 failures: set `pin_locked_until = now() + 15 minutes` on the profile → redirect to `/select-user` with a lockout error.
7. **Locked profile:** if `pin_locked_until` is in the future, `/select-user` shows a "Locked" badge on the card and the card is not tappable. Any direct navigation to `/pin?userId=<profileId>` for a locked profile redirects to `/select-user`.

### Inactivity Lockout
- `InactivityProvider` React context tracks user interaction events (`mousemove`, `keydown`, `pointerdown`, `touchstart`).
- After **5 minutes** of idle: client POSTs to a Server Action to clear the `activeUser` cookie → client navigates to `/select-user`.
- Timer resets on any user interaction.

### Explicit Sign-Off
- Server Action clears `activeUser` cookie → redirect to `/select-user`.

### First-Time PIN Setup (pin_hash = null)
1. User taps their card on `/select-user`.
2. Server detects `pin_hash = null` for that `profileId` → redirect to `/setup-pin?userId=<profileId>`.
3. User enters their **email + password** to verify identity (one-time).
4. Server Action calls `supabase.auth.signInWithPassword()` server-side to verify credentials.
5. If the authenticated email does not match the selected profile's email → error, stay on `/setup-pin`.
6. On success: user enters + confirms a 4-digit PIN → Server Action hashes with bcrypt, saves to `profiles.pin_hash`.
7. Server Action sets signed `activeUser` cookie → redirect to `/dashboard`. Middleware routes `admin` to `/dashboard` while also allowing access to `/dashboard/membership-registration`, and routes `staff` to `/dashboard/membership-registration`.

### Membership Journey After Authentication
- Staff land on `/dashboard/membership-registration` after PIN entry.
- Admin land on `/dashboard` after PIN entry, with quick-access buttons for the same membership journeys.
- Both roles can start either `New Membership` or `Membership Renewal`.
- Both entry surfaces feed into one shared membership flow.
- The shared flow preserves the full journey context:
  - original intent (`New Membership` or `Membership Renewal`)
  - chosen next action (`Membership Form` or `Generate Email Form`)
  - selected member for renewals
  - selected membership type
- Planned downstream order:
  - choose `Membership Form` or `Generate Email Form`
  - for renewals only, search and select the existing member before continuing
  - choose membership type
  - continue into the final form or email screen with all context preserved
- The `Membership Form` path then enters a shared 4-step form:
  - `Personal Details`
  - `Membership Details`
  - `Safeguarding & Medical`
  - `Additional Info and Consent` (placeholder for now)

### Security Properties
- No Supabase session cookie exists on the device at rest.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and never in any client bundle.
- `ACTIVE_USER_SECRET` is server-only and never in any client bundle.
- Raw PIN is never logged, returned to the client, or stored unhashed.
- Lockout state (`pin_locked_until`) is authoritative in the DB, not in client state.

---

## 6. Role-Based Access Rules

| Route | `staff` | `admin` |
|---|---|---|
| `/select-user` | ✅ (unauthenticated only) | ✅ (unauthenticated only) |
| `/dashboard` | ❌ → redirect `/dashboard/membership-registration` | ✅ |
| `/dashboard/submissions` | ❌ → redirect `/dashboard/membership-registration` | ✅ |
| `/dashboard/members` | ❌ → redirect `/dashboard/membership-registration` | ✅ |
| `/dashboard/member-submissions` | ❌ → redirect `/dashboard/membership-registration` | ✅ |
| `/dashboard/member-lists` | ❌ → redirect `/dashboard/membership-registration` | ✅ |
| `/dashboard/membership-registration` | ✅ | ✅ |
| `/dashboard/new-member` | ✅ | ✅ |
| `/dashboard/membership-renewal` | ✅ | ✅ |
| `/dashboard/membership/choice` | ✅ | ✅ |
| `/dashboard/membership/member-search` | ✅ | ✅ |
| `/dashboard/membership/type` | ✅ | ✅ |
| `/dashboard/membership/form` | ✅ | ✅ |
| `/dashboard/membership/email` | ✅ | ✅ |

**Enforcement:** middleware reads role and issues redirects server-side. No role logic runs on the client.

---

## 7. Page / Route Map

| Path | Component | Auth Required | Role |
|---|---|---|---|
| `/select-user` | `SelectUserPage` | No | staff/admin |
| `/pin` | `PinEntryPage` | No | staff/admin |
| `/setup-pin` | `SetupPinPage` | No | staff/admin |
| `/dashboard` | `AdminDashboardHome` | Yes | admin |
| `/dashboard/submissions` | `AdminSubmissionsPage` | Yes | admin |
| `/dashboard/members` | `AdminMembersPage` | Yes | admin |
| `/dashboard/member-submissions` | `AdminMemberSubmissionsPage` | Yes | admin |
| `/dashboard/member-lists` | `AdminMemberListsPage` | Yes | admin |
| `/dashboard/membership-registration` | `StaffMembershipRegistrationPage` | Yes | staff/admin |
| `/dashboard/new-member` | `NewMembershipEntryPage` | Yes | staff/admin |
| `/dashboard/membership-renewal` | `MembershipRenewalEntryPage` | Yes | staff/admin |
| `/dashboard/membership/choice` | `SharedMembershipChoicePage` | Yes | staff/admin |
| `/dashboard/membership/member-search` | `RenewalMemberSearchPage` | Yes | staff/admin |
| `/dashboard/membership/type` | `MembershipTypeSelectionPage` | Yes | staff/admin |
| `/dashboard/membership/form` | `SharedMembershipFormPage` | Yes | staff/admin |
| `/dashboard/membership/email` | `MembershipEmailFlowPage` | Yes | staff/admin |

### Branding and Layout

The Baffy golf club branding (icon + text) appears consistently across the app:

- **Select User page** (`/select-user`): Branding positioned fixed top-left, over the profile grid
- **PIN Entry page** (`/pin`): Branding positioned fixed top-left, over the PIN form
- **Dashboard header** (`/dashboard` and subpages): Branding displayed in a full-width header above the sidebar
- **Membership flow screens** (form, stepper, type, registration): No branding or header displayed — user stays focused on the form

The Baffy branding component is defined in `components/BaffyBrand.tsx` and imported where needed. It renders a golf club SVG icon (#2b2b2b) followed by "Baffy" text.

---

## 8. Environment Variables

All variables must be set in Vercel and in `.env.local` for local dev.

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key — used for unauthenticated public reads only
SUPABASE_SERVICE_ROLE_KEY=       # Server-only — all authenticated DB operations; never exposed to client
ACTIVE_USER_SECRET=              # Server-only — symmetric secret for signing/verifying activeUser cookie; min 32 chars
```

`.env.local` must be in `.gitignore`.
`SUPABASE_SERVICE_ROLE_KEY` and `ACTIVE_USER_SECRET` must **never** appear in any client bundle.
`NEXT_PUBLIC_*` variables are safe to expose to the browser; all others are not.

---

## 9. Non-Goals (Phase 1)

- Score tracking
- Handicap calculation
- Course management
- Tee time booking
- Mobile / native app
- OAuth / social login
- Email verification flows (beyond Supabase defaults)
- Admin CRUD for creating/editing profiles (read-only dashboards only)

---

## 10. Coding Conventions

- **TypeScript strict mode** — `"strict": true` in `tsconfig.json`. No `any`.
- **Named exports only** — no default exports except Next.js page/layout files where the framework requires it.
- **Tailwind CSS** — all styling via Tailwind utility classes. No inline styles. No CSS modules unless unavoidable.
- **Server-first** — prefer Server Components. Only use `"use client"` when interactivity requires it.
- **No secrets on client** — `SUPABASE_SERVICE_ROLE_KEY` and any sensitive keys are server-only.
- **File naming** — `kebab-case` for files and folders. Component names in `PascalCase`.
- **Imports** — use path aliases (`@/`) configured in `tsconfig.json`.
- **Linting** — ESLint with Next.js config. Prettier for formatting.
