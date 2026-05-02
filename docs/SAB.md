# SAB — Spec and Build Document
**Golf Club Management App — Phase 1 MVP**
_Single source of truth for all implementation decisions._

---

## 1. Project Overview

A web-based Golf Club Management application that allows club staff to manage member and staff records, and allows individual members to view their own profile. Phase 1 delivers authentication, role-based access control, and read-only dashboards.

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
| role | text | CHECK (role IN ('member', 'staff')), not null |
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
{ "profileId": "uuid", "displayName": "string", "role": "staff|member", "expiresAt": "ISO8601" }
```

- Cookie is `httpOnly`, `sameSite=strict`, server-signed.
- Expires after **8 hours** (shift duration).
- Cleared on explicit sign-off or inactivity lockout.
- Middleware reads this cookie to identify the active user on every request — no DB call required per request.

### Normal Auth Flow
1. Device shows `/select-user` — a server-rendered grid of all staff profile cards (name + avatar), fetched via service role.
2. Staff taps their card → navigates to `/pin?userId=<profileId>`.
3. Staff enters 4-digit PIN → Server Action receives `profileId` + `pin`.
4. Server Action fetches `profiles.pin_hash` via service role → `bcrypt.compare()` server-side.
5. **Success:** Server Action sets signed `activeUser` cookie → redirect to `/staff`.
6. **Failure:** Server Action increments `pin_fail_count` on the profile row. After 5 failures: set `pin_locked_until = now() + 15 minutes` on the profile → redirect to `/select-user` with a lockout error.
7. **Locked profile:** if `pin_locked_until` is in the future, `/select-user` shows a "Locked" badge on the card and the card is not tappable. Any direct navigation to `/pin?userId=<profileId>` for a locked profile redirects to `/select-user`.

### Inactivity Lockout
- `InactivityProvider` React context tracks user interaction events (`mousemove`, `keydown`, `pointerdown`, `touchstart`).
- After **5 minutes** of idle: client POSTs to a Server Action to clear the `activeUser` cookie → client navigates to `/select-user`.
- Timer resets on any user interaction.

### Explicit Sign-Off
- Server Action clears `activeUser` cookie → redirect to `/select-user`.

### First-Time PIN Setup (pin_hash = null)
1. Staff taps their card on `/select-user`.
2. Server detects `pin_hash = null` for that `profileId` → redirect to `/setup-pin?userId=<profileId>`.
3. Staff enters their **email + password** to verify identity (one-time).
4. Server Action calls `supabase.auth.signInWithPassword()` server-side to verify credentials.
5. If the authenticated email does not match the selected profile's email → error, stay on `/setup-pin`.
6. On success: staff enters + confirms a 4-digit PIN → Server Action hashes with bcrypt, saves to `profiles.pin_hash`.
7. Server Action sets signed `activeUser` cookie → redirect to `/staff`.

### Security Properties
- No Supabase session cookie exists on the device at rest.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and never in any client bundle.
- `ACTIVE_USER_SECRET` is server-only and never in any client bundle.
- Raw PIN is never logged, returned to the client, or stored unhashed.
- Lockout state (`pin_locked_until`) is authoritative in the DB, not in client state.

---

## 6. Role-Based Access Rules

| Route | `member` | `staff` |
|---|---|---|
| `/login` | ✅ (unauthenticated only) | ✅ (unauthenticated only) |
| `/dashboard` | ✅ own profile only | ✅ redirected to `/staff` |
| `/staff/members` | ❌ → redirect `/dashboard` | ✅ |
| `/staff/staff` | ❌ → redirect `/dashboard` | ✅ |

**Enforcement:** middleware reads role and issues redirects server-side. No role logic runs on the client.

---

## 7. Page / Route Map

| Path | Component | Auth Required | Role |
|---|---|---|---|
| `/login` | `LoginPage` | No | Any |
| `/dashboard` | `MemberDashboard` | Yes | member |
| `/staff` | `StaffLayout` | Yes | staff |
| `/staff/members` | `MembersListPage` | Yes | staff |
| `/staff/staff` | `StaffListPage` | Yes | staff |

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
