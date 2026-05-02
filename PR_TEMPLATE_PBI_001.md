## PBI-001: Project Scaffold

Initializes Next.js 14 (App Router) project with TypeScript strict mode, Tailwind CSS, and Supabase client setup.

### What's Done
- Next.js 14 with App Router and TypeScript
- TypeScript strict mode enabled
- Tailwind CSS v3 configured
- Supabase SSR client helpers (`lib/supabase/server.ts`, `lib/supabase/client.ts`)
- `bcrypt` and `iron-session` installed for kiosk auth
- ESLint configured with Next.js preset
- `.env.local.example` with all 4 required env vars
- `.env.local` excluded from git

### Verify It Works

**Build succeeds:**
```bash
npm run build
```
Should complete without TypeScript errors.

**Linting passes:**
```bash
npm run lint
```
Should report zero errors.

**Dev server starts:**
```bash
npm run dev
```
Then open http://localhost:3000 — you should see the Next.js default page with Tailwind styling applied.

**Supabase clients load correctly:**
Create a temporary test file `test.ts` in the root:
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'

console.log('Service role client:', typeof createServiceRoleClient)
console.log('Browser client:', typeof createBrowserClient)
```
Run `npx ts-node test.ts` — both should log as functions. Then delete the test file.

### Acceptance Criteria Met
- ✅ `npm run build` passes
- ✅ `npm run lint` passes
- ✅ Tailwind configured and rendering
- ✅ Supabase clients created
- ✅ `bcrypt` and `iron-session` installed
- ✅ TypeScript strict mode enabled
- ✅ `.env.local` gitignored
