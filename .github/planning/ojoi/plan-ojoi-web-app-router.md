# Official Journal Web: Pages Router → App Router + tRPC Migration

## Current Status (as of 2026-02-21)

### Branch: `feat/ojoi-web-app-router`

| Phase | Status | Committed | Notes |
|-------|--------|-----------|-------|
| Phase 1: Infrastructure | ✅ DONE | ✅ c02b73b4 | auth, middleware, tRPC scaffolding, root layout, providers |
| Phase 2: tRPC Routers | ✅ DONE | ✅ 220fad59 | 12 routers, 76+ procedures |
| Phase 3A: Pages A | ✅ DONE | ✅ 857a489e | Dashboard, Login, Ritstjorn, Utgafa, Heildaryfirlit + caseContext rewrite |
| Phase 3B: Pages B | ✅ DONE | ✅ 857a489e | Yfirflokkar, Tegundir, Notendur, Yfirskrifa-pdf, Auglysing, Reglugerd, error + categoryContext + userContext rewrites |
| Phase 3 fixes | ✅ DONE | ✅ 857a489e | Import ordering auto-fixed via eslint --fix. tsc + lint pass. |
| Phase 4A: Safe deletions | ✅ DONE | ✅ 5ab0e42d | Deleted pages/ (incl pages/api/), layout/, handlers/, routeHandler, constants cleaned (legacy → constants-legacy.ts), imports fixed |
| Phase 4B-1: Migrate components batch 1 | ✅ DONE | ✅ 4bd9aef9 | case-update-fields + signature + comments + corrections (9 files). Correct tRPC v11 pattern. Added updateAppendix to attachmentsRouter. |
| Phase 4B-2: Migrate components batch 2 | ✅ DONE | ✅ 8654e2fe | categories + advert-types (9 files). Bug: casesRouter.updateType collides with typesRouter.updateType — fix: rename casesRouter procedure to updateCaseType |
| Phase 4B-3: Migrate components batch 3 | ✅ DONE | ✅ 3fe0e833 | case-filters + tabs + tables (10 files). KEY FINDING: tRPC v11 uses useQuery(trpc.*.queryOptions()) NOT trpc.*.useQuery() — 4B-1 and 4B-2 used wrong pattern and need fixes |
| Phase 4B-4: Migrate components batch 4 | ✅ DONE | ✅ afee632f | users + create-case + price + form (5 files, layout already deleted). Added missing router procedures: createInstitution, updateInstitution, deleteInstitution, createCase, getPaymentStatus |
| Phase 4C: Final cleanup | ✅ DONE | ✅ ab8a53f1 | Deleted hooks/api/ (54 files), constants-legacy.ts. Created /api/health. OJOIWebException moved to constants.ts. tsc + lint clean. swr safe to remove from package.json. |

### All fixes applied to date:
- `middleware.ts`: root route `/` exact match only (infinite redirect bug)
- `communicationsRouter.ts`: added `createCommunicationChannel` + `deleteCommunicationChannel`
- `casesRouter.ts`: `updateStatus` uses `z.nativeEnum(CaseStatusEnum)`, added `getDepartments`/`getTags`/`getFeeCodes`, added `getAdvert`
- Phase 3 import ordering: auto-fixed via `yarn nx lint official-journal-web --fix`

### Why Phase 4 was split:
The original plan said "keep `src/components/` — all UI components stay, update imports as needed." This underestimated the scope: **28+ component files** directly import from `hooks/api/` (the SWR data layer). Simply deleting `hooks/api/` breaks the build immediately. Each component must be migrated from SWR hooks to `useTRPC()` calls before the old hooks can be deleted.

### Migration: COMPLETE

All phases finished. swr dependency removed from package.json (commit 6ec798b2). No legacy imports remain (SWR, hooks/api, next/router, next-usequerystate). pages/ directory deleted. tsc passes cleanly.

### Active agents:
- All agents: terminated

### Team: `ojoi-app-router-migration` | Branch: `feat/ojoi-web-app-router`

---

## Agent Context Management

**IMPORTANT for all agents**: Clear your context between task phases to stay efficient.

### Agent lifecycle — ONE task per agent, then shutdown

Each agent is spawned fresh for exactly one task, then shut down. Do not reuse agents across phases — context accumulates too fast.

**Implementation agents**: complete task → report to team-lead → mark task completed → await shutdown_request.

**Reviewer agents**: spawn fresh per phase review → invoke skills → review → report to team-lead → await shutdown_request.

### When starting your task (all agents):
1. Read this plan file: `.github/planning/ojoi/plan-ojoi-web-app-router.md`
2. Invoke the relevant skills for your role:
   - **All implementation agents**: `/next-best-practices` + `/vercel-react-best-practices`
   - **Reviewer**: `/next-best-practices` + `/vercel-react-best-practices` (required before every review)
   - **tRPC agents**: also invoke `/trpc-router`
   - **Page migration agents**: also invoke `/nextjs-page`
3. Read the reference implementation: `apps/legal-gazette-web/src/`
4. Proceed with your task

### Phase gate flow:
1. Implementation agent completes phase → shuts down
2. Fresh Reviewer agent reviews → if clean: **commits the phase** with the appropriate commit message → reports all-clear to team-lead → shuts down
3. If BLOCKING issues found: reviewer reports without committing → fresh Fix agent applies fixes → runs tsc → **commits the fixes** → shuts down → team-lead spawns reviewer again to verify
4. Next phase implementation agent spawns only after reviewer gives all-clear

### Commit messages per phase (use these exactly):
- Phase 1: `feat(ojoi-web): Phase 1 — App Router infrastructure (auth, middleware, tRPC scaffolding)`
- Phase 2: `feat(ojoi-web): Phase 2 — tRPC routers (12 routers, 76+ procedures)`
- Phase 2 fixes: `fix(ojoi-web): Phase 2 — add missing router procedures, fix Zod schema`
- Phase 3: `feat(ojoi-web): Phase 3 — App Router page migrations (15 pages, context rewrites)`
- Phase 4: `feat(ojoi-web): Phase 4 — cleanup (delete pages/, hooks/api/, update imports)`

### Git commit instructions for agents:
- Stage only the files from your phase: `git add <specific files>` — never `git add -A`
- Always use the HEREDOC format for commit messages
- Always append: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Run `git status` after committing to confirm success

---

## Context

The `official-journal-web` app currently uses Next.js **Pages Router** with OpenAPI-generated clients and SWR for data fetching. All other admin apps in the monorepo (`legal-gazette-web`, `legal-gazette-application-web`, `legal-gazette-public-web`) have already migrated to **App Router** with **tRPC** and **React Query**. This migration aligns `official-journal-web` with the rest of the codebase, enabling:

- Consistent architecture across all DMR admin apps
- Type-safe end-to-end data fetching via tRPC
- Server Components for initial data loading (eliminating client-side waterfalls)
- Shared patterns from `@dmr.is/auth/middleware-helpers` for auth/middleware
- Edge-compatible logging via `@dmr.is/logging-next`

**Reference implementation**: `apps/legal-gazette-web/` — follow its patterns exactly.

**Branch**: `feat/ojoi-web-app-router`

---

## Decisions (Confirmed by User)

| Decision | Choice |
|----------|--------|
| Data layer | Migrate to tRPC (replace OpenAPI/SWR) |
| API routes | Eliminated via tRPC (no proxy layer) |
| Next.js version | Next 15 patterns (async params/searchParams) |
| Layout strategy | Route-group layouts (all pages behind auth) |
| Role checking | Keep in middleware (custom post-auth logic) |
| Migration strategy | Big-bang switch (delete pages/, create app/) |
| Logger | `@dmr.is/logging` → `@dmr.is/logging-next` |
| Plan location | `.github/planning/ojoi/` |

---

## Agent Distribution

### Implementation Agents (4)

| Agent | Scope | Phase |
|-------|-------|-------|
| **Agent 1: Infrastructure** | Auth, middleware, providers, config, tRPC scaffolding | Phase 1 |
| **Agent 2: tRPC Routers** | All 12 tRPC routers mapping ~55 API routes | Phase 2 |
| **Agent 3: Pages A** | Dashboard, login, ritstjorn/*, utgafa/*, heildaryfirlit | Phase 3 |
| **Agent 4: Pages B** | yfirflokkar, tegundir, notendur, yfirskrifa-pdf/*, auglysing-til-ritstjornar, reglugerd-i-ritstjorn, error page | Phase 3 |

### Reviewer Agent (1)

| Agent | Role |
|-------|------|
| **Agent 5: Devil's Advocate** | Reviews all changes after each phase. Flags: RSC boundary violations, missing `'use client'`, non-serializable props, Edge Runtime incompatibilities, broken imports, missing tRPC procedures |

### Phase Dependencies

```text
Phase 1 (Agent 1) ──→ Phase 2 (Agent 2) ──→ Phase 3 (Agents 3+4 parallel)
                                                       ↓
                                              Phase 4 (cleanup + verify)
```

After each phase completes, **Agent 5 reviews** before next phase begins.

---

## Phase 1: Infrastructure (Agent 1)

All agents should reference `apps/legal-gazette-web/` as the canonical example.

### 1.1 Auth Options

**Create**: `src/lib/auth/authOptions.ts`

**Reference**: `apps/legal-gazette-web/src/lib/auth/authOptions.ts`

Migrate from `src/pages/api/auth/[...nextauth].ts` (lines 1–167):

- Replace `import { decode } from 'jsonwebtoken'` → `import { decodeJwt } from 'jose'`
- Replace `import { getLogger } from '@dmr.is/logging'` → `import { getLogger } from '@dmr.is/logging-next'`
- Replace `import { identityServerConfig } from '@dmr.is/auth/identityServerConfig'` → use local config pattern (like LG web lines 24–39)
- Remove inline `refreshAccessToken`/`isExpired` from JWT callback — middleware handles refresh now
- Keep `authorize()` function calling `getDmrClient(idToken).getUserByNationalId()` — uses `gen/fetch` types (`UserDto`, `UserRoleDto`)
- Keep `session.user.role` in session callback (OJ web has roles, LG web does not)
- Export `authOptions` and `identityServerConfig` separately (do NOT default-export NextAuth)
- Use env var `OJOI_WEB_CLIENT_ID` and `OJOI_WEB_CLIENT_SECRET` for local config

**Key differences from LG web auth**: OJ web stores `user.role` and `user.displayName` (vs LG web which stores `user.name`). Preserve these OJ-specific fields.

### 1.2 Server Client

**Create**: `src/lib/api/serverClient.ts`

**Reference**: `apps/legal-gazette-web/src/lib/api/serverClient.ts`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/authOptions'
import { getDmrClient } from './createClient'

export async function getServerClient(token?: string) {
  return getDmrClient(
    token ?? ((await getServerSession(authOptions))?.idToken as string),
  )
}
```

**Keep**: `src/lib/api/createClient.ts` unchanged — it wraps the generated `DefaultApi` with `getDmrClient`.

### 1.3 Middleware

**Modify**: `src/middleware.ts`

**Reference**: `apps/legal-gazette-web/src/middleware.ts` + `libs/shared/auth/src/lib/middleware-helpers.ts`

Replace the current manual `getToken` + role-checking middleware with `createAuthMiddleware` from `@dmr.is/auth/middleware-helpers`, then wrap with custom admin role checking.

The current middleware (lines 1–43) does:

1. Auth check via `getToken`
2. Admin role check: `token?.role?.slug === 'ritstjori'`
3. Non-admins redirected to `/notendur`

New approach — compose `createAuthMiddleware` with role checking:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createAuthMiddleware } from '@dmr.is/auth/middleware-helpers'
import { identityServerConfig } from './lib/auth/authOptions'

const ADMIN_ONLY_ROUTES = [
  '/',
  '/yfirflokkar',
  '/tegundir',
  '/ritstjorn',
  '/utgafa',
  '/heildaryfirlit',
]

const authMiddleware = createAuthMiddleware({
  clientId: identityServerConfig.clientId,
  clientSecret: identityServerConfig.clientSecret,
  redirectUriEnvVar: 'OFFICIAL_JOURNAL_WEB_URL',
  fallbackRedirectUri: process.env.IDENTITY_SERVER_LOGOUT_URL as string,
  signInPath: '/innskraning',
  checkIsActive: false,
  skipDefaultUrlCheck: true,
})

export default async function middleware(req: NextRequest) {
  // Run auth middleware (handles token refresh + cookie management)
  const authResponse = await (authMiddleware as Function)(req, {
    waitUntil: () => {},
  })

  // For admin-only routes, check role
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(
    (route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isAdminRoute) {
    const token = await getToken({ req })
    const isAdmin = token?.role?.slug === 'ritstjori'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/notendur', req.url))
    }
  }

  return authResponse
}

export const config = {
  matcher: [
    `/((?!api|innskraning|_next/static|_next/image|images|fonts|.well-known|assets|favicon.ico).*)`,
    '/api/trpc/(.*)',
  ],
}
```

**IMPORTANT**: Test this composition pattern carefully. If `createAuthMiddleware`'s `withAuth` wrapper conflicts with the role-check `getToken` call, fall back to writing middleware inline using the same utility functions (`isExpired`, `refreshAccessToken`, `updateCookie`, `tryToUpdateCookie`) from `@dmr.is/auth/middleware-helpers`.

### 1.4 tRPC Scaffolding

**Reference files** (copy patterns exactly):

| File to Create | Reference |
|---------------|-----------|
| `src/lib/trpc/server/trpc.ts` | `apps/legal-gazette-web/src/lib/trpc/server/trpc.ts` |
| `src/lib/trpc/client/trpc.ts` | `apps/legal-gazette-web/src/lib/trpc/client/trpc.ts` |
| `src/lib/trpc/client/Provider.tsx` | `apps/legal-gazette-web/src/lib/trpc/client/Provider.tsx` |
| `src/lib/trpc/client/server.tsx` | `apps/legal-gazette-web/src/lib/trpc/client/server.tsx` |
| `src/lib/trpc/server/routers/_app.ts` | `apps/legal-gazette-web/src/lib/trpc/server/routers/_app.ts` |

**Server context** (`trpc.ts`): Use `createTRPCContext` with `cache()`, calling `getServerClient(session.idToken)`. The context type is `{ api: DefaultApi }` where `DefaultApi` comes from `gen/fetch`.

**Client** (`trpc.ts`): Use `createTRPCContext` from `@trpc/tanstack-react-query`.

**Provider** (`Provider.tsx`): `'use client'`, creates `QueryClient` singleton + `httpBatchLink` to `/api/trpc`.

**Server proxy** (`server.tsx`): `'server-only'`, `createTRPCOptionsProxy` for Server Component prefetching.

### 1.5 API Route Handlers

**Create**: `src/app/api/trpc/[trpc]/route.ts`

**Reference**: `apps/legal-gazette-web/src/app/api/trpc/[trpc]/route.ts`

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../../lib/trpc/server/routers/_app'
import { createTRPCContext } from '../../../../lib/trpc/server/trpc'

const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
  })
  return response
}
export { handler as GET, handler as POST }
```

**Create**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '../../../../lib/auth/authOptions'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Create**: `src/app/api/auth/logout/route.ts` — port from `pages/api/auth/logout.ts`

### 1.6 Root Layout

**Create**: `src/app/layout.tsx`

**Reference**: `apps/legal-gazette-web/src/app/layout.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { globalStyles } from '@dmr.is/ui/globalStyles'
import { authOptions } from '../lib/auth/authOptions'
import { RootProviders } from '../components/providers/RootProviders'
import '../styles/global.css'

globalStyles()

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="is">
      <body>
        <RootProviders session={session}>{children}</RootProviders>
      </body>
    </html>
  )
}
```

### 1.7 RootProviders

**Create**: `src/components/providers/RootProviders.tsx`

**Reference**: `apps/legal-gazette-web/src/components/providers/RootProviders.tsx`

`'use client'` component wrapping:

1. `TRPCReactProvider` (from `lib/trpc/client/Provider.tsx`)
2. `NuqsAdapter` (replaces `next-usequerystate`)
3. `SessionProvider` (from `next-auth/react`) — with `refetchInterval={60}`, `basePath="/api/auth"`
4. `IntlProvider` (from `react-intl`) — with `locale="is"`, `messages={icelandic}`, same `onError` handler as current Layout.tsx
5. `ToastContainer` (from `@dmr.is/ui/components/island-is/ToastContainer`)
6. `ReactQueryDevtools` (conditional on dev)

**Font handling**: Move IBM Plex Sans `@font-face` declarations from Layout.tsx JSX `<style>` tag into `src/styles/global.css` file. Add `<link rel="preload">` for font files in root layout's `<head>` via metadata export or `<Head>`.

### 1.8 Protected Layout

**Create**: `src/app/(protected)/layout.tsx`

`'use client'` component with:

- `Page` component wrapper (from `@dmr.is/ui/components/island-is/Page`)
- `Header` component
- `Main` wrapper
- `Footer` (conditional — need per-route config, see 1.9)
- `PageLoader`

### 1.9 Banner/Layout Config Strategy

The current Pages Router passes `LayoutProps` (banner config, footer visibility, headerWhite) via `getServerSideProps`. In App Router, this pattern doesn't exist.

**Strategy**: Each page owns its own banner configuration. Extract `Banner` as a standalone component that each page renders directly. The `(protected)/layout.tsx` provides only the shared shell (Header, Main wrapper, Page).

Pages that need banners import and render `<Banner {...config} />` directly in their page component. Pages that show footer render `<Footer />` directly.

### 1.10 Config Updates

**Modify**: `next.config.js`

- No structural changes needed — Vanilla Extract, Nx, turbopack, canvas alias, standalone output all remain
- Verify `NEXTAUTH_URL` env still resolves correctly with App Router's `/api/auth` path

**Modify**: `project.json`

- Remove `codegen`/`update-schema` targets — **WAIT**: We still need the generated client for tRPC server context. Keep codegen targets but they're used less frequently.
- Actually: **keep codegen as-is**. The generated `DefaultApi` from `gen/fetch` is used inside tRPC routers on the server side.

### 1.11 Package Dependencies

**Add** (if not already present):

- `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` — check LG web's versions
- `@tanstack/react-query`, `@tanstack/react-query-devtools`
- `nuqs` — replaces `next-usequerystate`
- `jose` — replaces `jsonwebtoken` for Edge-compatible JWT decoding
- `server-only` — for server.tsx

**Remove** (after migration complete):

- `swr` (if no other app uses it from this package.json)
- `next-usequerystate` → replaced by `nuqs`
- `jsonwebtoken` → replaced by `jose`

---

## Phase 2: tRPC Routers (Agent 2)

### Router Mapping

Map the ~55 API route handlers + ~45 SWR hooks into 12 tRPC routers. Each router is a file in `src/lib/trpc/server/routers/`.

**Reference router**: `apps/legal-gazette-web/src/lib/trpc/server/routers/advertsRouter.ts`

**Pattern**:

```typescript
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

export const casesRouter = router({
  getCase: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.api.getCase({ id: input.id })
    }),
  // ... more procedures
})
```

### Router Files to Create

| Router File | Source API Routes | Source Hooks |
|------------|-------------------|--------------|
| `casesRouter.ts` | `cases/[id]/index`, `cases/index`, `cases/[id]/reject`, `cases/[id]/unpublish`, `cases/[id]/updateNextStatus`, `cases/[id]/updatePreviousStatus`, `cases/[id]/updateStatus`, `cases/[id]/updateAdvertHtml`, `cases/[id]/updateAdvertWithCorrection`, `cases/[id]/updateCategories`, `cases/[id]/updateDepartment`, `cases/[id]/updateEmployee`, `cases/[id]/updateFasttrack`, `cases/[id]/updatePrice`, `cases/[id]/updatePublishDate`, `cases/[id]/updateTag`, `cases/[id]/updateTitle`, `cases/[id]/updateType`, `cases/[id]/previewPdf`, `cases/[id]/updateCommunicationStatus` | `useCase`, `useUpdateCaseStatus`, `useUpdateCategories`, `useUpdateDepartment`, `useUpdateEmployee`, `useUpdateFasttrack`, `useUpdateNextStatus`, `useUpdatePreviousStatus`, `useUpdatePrice`, `useUpdatePublishDate`, `useUpdateTag`, `useUpdateTitle`, `useUpdateType`, `useUpdateAdvertHtml`, `useUpdateAdvertAndCorrection`, `useUpdateCommunicationStatus`, `useRejectCase`, `useUnpublish` |
| `commentsRouter.ts` | `cases/[id]/comments/createExternalComment`, `cases/[id]/comments/createInternalComment`, `cases/[id]/comments/[cid]/delete` | `useAddComment`, `useDeleteComment` |
| `publishRouter.ts` | `cases/publish`, `cases/withPublicationNumber`, `cases/withStatusCount`, `cases/withDepartmentCount` | `usePublishCases`, `useCasesWithPublicationNumber`, `useCasesWithStatusCount`, `useCasesWithDepartmentCount` |
| `categoriesRouter.ts` | `categories/index`, `categories/[id]`, `categories/merge` | `useCategories` |
| `mainCategoriesRouter.ts` | `mainCategories/index`, `mainCategories/[id]`, `mainCategories/[id]/categories/index`, `mainCategories/[id]/categories/[cid]` | `useMainCategories` |
| `typesRouter.ts` | `types/index`, `types/[id]`, `mainTypes/index`, `mainTypes/[id]` | `useAdvertTypes`, `useMainTypes` |
| `signaturesRouter.ts` | `signatures/[id]/index`, `signatures/[id]/records/index`, `signatures/[id]/records/[recordId]/index`, `signatures/[id]/records/[recordId]/members/index`, `signatures/[id]/records/[recordId]/members/[mid]` | `useSignature`, `useUpdateSignature`, `useUpdateSignatureDisplay` |
| `institutionsRouter.ts` | `institutions/index`, `institutions/[id]` | `useInstitutions` |
| `statisticsRouter.ts` | `statistics/department`, `statistics/overview` | `useStatistics` |
| `usersRouter.ts` | (via `useUsers` hook — calls `getUsers`, `createUser`, `updateUser`, `deleteUser`, `getRolesByUser`, `getInvolvedPartiesByUser`) | `useUsers` (in `hooks/users/useUsers.ts`), also `useGetAvailableInvolvedParties`, `useUpdateInvolvedParty` |
| `communicationsRouter.ts` | `cases/communicationStatuses` | `useCommunicationChannels`, `useGetCommunicationStatuses` |
| `attachmentsRouter.ts` | `cases/[id]/attachments/[aid]/index`, `cases/[id]/uploadAssets` | `useCreateAppendix`, `useDeleteAppendix`, `useUpdateAppendix` |

### Special Cases

**File upload** (`useUpdateAdvertPDF`): This hook calls `dmrClient.advertPDFReplacement({ id, file })` directly from the client with session token. tRPC does not natively handle `File` uploads via `httpBatchLink`. Options:

1. **Keep as standalone route handler**: Create `src/app/api/cases/[id]/upload-pdf/route.ts` as a standard App Router route handler
2. The `useUpdateAdvertPDF` hook continues to call the backend API directly (it already bypasses Next.js API routes)

**Recommendation**: Keep option 2 — `useUpdateAdvertPDF` already calls the OpenAPI client directly. Just update it to use tRPC's `useTRPC` for session access pattern if needed, but the direct client call pattern works fine.

**Migration case** (`useMigrateAdvertToCase`): Include in `casesRouter.ts`.

**Regulation publishing** (`usePublishAdvertRegulation`): Include in `publishRouter.ts`.

### Register All Routers

**Update**: `src/lib/trpc/server/routers/_app.ts`

```typescript
import { mergeRouters } from '../trpc'
import { casesRouter } from './casesRouter'
import { commentsRouter } from './commentsRouter'
import { publishRouter } from './publishRouter'
import { categoriesRouter } from './categoriesRouter'
import { mainCategoriesRouter } from './mainCategoriesRouter'
import { typesRouter } from './typesRouter'
import { signaturesRouter } from './signaturesRouter'
import { institutionsRouter } from './institutionsRouter'
import { statisticsRouter } from './statisticsRouter'
import { usersRouter } from './usersRouter'
import { communicationsRouter } from './communicationsRouter'
import { attachmentsRouter } from './attachmentsRouter'

export const appRouter = mergeRouters(
  casesRouter,
  commentsRouter,
  publishRouter,
  categoriesRouter,
  mainCategoriesRouter,
  typesRouter,
  signaturesRouter,
  institutionsRouter,
  statisticsRouter,
  usersRouter,
  communicationsRouter,
  attachmentsRouter,
)

export type AppRouter = typeof appRouter
```

### Input Validation

Use Zod schemas for all procedure inputs. Derive schemas from the generated `gen/fetch` types where possible. For complex types, define Zod schemas inline.

### Error Handling

Use `apiErrorMiddleware` from `@dmr.is/trpc/utils/errorHandler` (already used in LG web's `protectedProcedure`). This middleware catches API client errors and wraps them as tRPC errors.

---

## Phase 3: Page Migration (Agents 3 + 4, parallel)

### General Pattern

For each page:

1. **Server Component** (default): If page only needs SSR data + static rendering
2. **Client Component**: If page uses hooks, state, event handlers — mark `'use client'`
3. **Hybrid**: Server Component fetches data via `trpc.*.queryOptions()` + `fetchQuery`, passes to client component

### Route Structure

```text
src/app/
├── layout.tsx                              (root layout — server)
├── (protected)/
│   ├── layout.tsx                          (shell — client: Header, Main, PageLoader)
│   ├── page.tsx                            (dashboard — / route)
│   ├── ritstjorn/
│   │   ├── page.tsx                        (case overview — /ritstjorn)
│   │   └── [...uid]/
│   │       └── page.tsx                    (case detail — /ritstjorn/[...uid])
│   ├── utgafa/
│   │   ├── page.tsx                        (publishing overview — /utgafa)
│   │   └── stadfesting/
│   │       └── page.tsx                    (confirm publishing — /utgafa/stadfesting)
│   ├── heildaryfirlit/
│   │   └── page.tsx                        (overall overview — /heildaryfirlit)
│   ├── yfirflokkar/
│   │   └── page.tsx                        (categories — /yfirflokkar)
│   ├── tegundir/
│   │   └── page.tsx                        (types — /tegundir)
│   ├── notendur/
│   │   └── page.tsx                        (users — /notendur)
│   ├── yfirskrifa-pdf/
│   │   ├── page.tsx                        (PDF replacement list — /yfirskrifa-pdf)
│   │   └── [...uid]/
│   │       └── page.tsx                    (PDF replacement detail)
│   ├── auglysing-til-ritstjornar/
│   │   └── page.tsx                        (advert migration)
│   └── reglugerd-i-ritstjorn/
│       └── page.tsx                        (regulation publishing)
├── innskraning/
│   └── page.tsx                            (login — outside protected group)
├── error.tsx                               (error boundary)
├── not-found.tsx                           (404)
└── api/
    ├── trpc/[trpc]/route.ts
    └── auth/
        ├── [...nextauth]/route.ts
        └── logout/route.ts
```

### Page-by-Page Migration Guide

#### Agent 3 Pages

**1. Dashboard (`/` → `(protected)/page.tsx`)**

- **Current**: `pages/index.tsx` — client component using `useStatistics` SWR hook
- **Pattern**: Client component (`'use client'`) because it uses `useState` for tabs and `useStatistics`
- **Migration**: Replace `useStatistics` SWR hook with tRPC: `const { useTRPC } = ...`, `useTRPC.getStatisticsForDepartment.useQuery(...)`, `useTRPC.getStatisticsOverviewDashboard.useQuery(...)`
- **Banner**: Render `<Banner>` directly in page with dashboard config (cards, image, title)
- **Footer**: Render `<Footer />` directly
- **Remove**: `getServerSideProps` (was only for session check + layout props)

**2. Login (`/innskraning` → `innskraning/page.tsx`)**

- **Current**: `pages/innskraning.tsx` — client component using `signIn`
- **Pattern**: `'use client'` component (uses `useState`, `signIn`)
- **Migration**: Straightforward — move JSX, remove `getServerSideProps`
- **Note**: Outside `(protected)` route group, so no auth middleware applied
- **searchParams**: Use `nuqs` or read `searchParams` prop for `callbackUrl`

**3. Case Processing Overview (`/ritstjorn` → `(protected)/ritstjorn/page.tsx`)**

- **Current**: `pages/ritstjorn/index.tsx` — dynamic import `CaseOverviewTabs` (ssr: false), redirect if no `?status`
- **Pattern**: Client component (uses `useFormatMessage`, renders dynamic components)
- **Migration**: Keep `next/dynamic` with `ssr: false` for `CaseOverviewTabs`. Handle the `?status` redirect — in App Router, use `redirect()` from `next/navigation` in a Server Component wrapper, or handle in the client component with `useSearchParams`
- **Banner**: Render `<Banner>` directly with processing overview config

**4. Case Detail (`/ritstjorn/[...uid]` → `(protected)/ritstjorn/[...uid]/page.tsx`)**

- **Current**: `pages/ritstjorn/[...uid].tsx` — **most complex page**
  - SSR: 7 parallel API calls (getCase first, then Promise.all for departments, users, categories, tags, feeCodes, types)
  - Client: `CaseProvider` context with `useCase`, `useSignature`, `useSWR` for advertTypes
- **Pattern**: **Hybrid** — Server Component fetches initial data, passes to client CaseProvider
- **Migration**:
  - Server Component: `async function CasePage({ params })` — use `await params` (Next 15), then `fetchQuery` with tRPC for all 7 calls via `Promise.all`
  - Pass fetched data as props to `<CaseDetailClient>` ('use client') which wraps `<CaseProvider>`
  - `CaseProvider` needs rewrite: replace `useCase`/`useSignature` SWR hooks with tRPC queries, replace direct `useSWR` for advertTypes with tRPC
- **Note**: `params.uid` is `string[]` (catch-all), use `params.uid[0]` for caseId

**5. Publishing Overview (`/utgafa` → `(protected)/utgafa/page.tsx`)**

- **Current**: `pages/utgafa/index.tsx` — dynamic import `ReadyForPublicationTabs` + `NotificationPortal`
- **Pattern**: Client component
- **Migration**: Similar to ritstjorn — keep dynamic imports, move banner config inline
- **Note**: Reads `?success=true` from query — use `useSearchParams()` from `next/navigation`

**6. Publish Confirmation (`/utgafa/stadfesting` → `(protected)/utgafa/stadfesting/page.tsx`)**

- **Current**: `pages/utgafa/stadfesting.tsx` — SSR fetches cases, client uses `usePublishCases` mutation + `useRouter`
- **Pattern**: Hybrid — Server Component fetches `casesWithPublicationNumber`, client handles mutation
- **Migration**:
  - Server Component: fetch cases via tRPC with `fetchQuery` using `searchParams.caseIds` and `searchParams.department`
  - Handle redirect (no caseIds → redirect to `/utgafa`) via `redirect()` in server component
  - Client component: `usePublishCases` → `useTRPC.publishCases.useMutation()`
  - Replace `useRouter` from `next/router` → `useRouter` from `next/navigation`

**7. Overall Overview (`/heildaryfirlit` → `(protected)/heildaryfirlit/page.tsx`)**

- **Current**: `pages/heildaryfirlit/index.tsx` — dynamic import `CasePublishedTabs`, redirect if no `?department`
- **Pattern**: Client component
- **Migration**: Handle `?department` redirect in server component or client. Keep dynamic import for tabs.

#### Agent 4 Pages

**8. Categories (`/yfirflokkar` → `(protected)/yfirflokkar/page.tsx`)**

- **Current**: `pages/yfirflokkar/index.tsx` — SSR fetches mainCategories, categories, departments via Promise.all, wraps in `CategoryProvider`
- **Pattern**: Hybrid — Server Component fetches, passes to client `CategoryProvider`
- **Migration**:
  - Server: fetch via tRPC `Promise.all([fetchQuery(trpc.getMainCategories...), ...])`
  - Pass to `<CategoriesPageClient>` which wraps `<CategoryProvider>`
  - `CategoryProvider` needs rewrite: replace `useMainCategories`/`useCategories` SWR hooks with tRPC

**9. Types (`/tegundir` → `(protected)/tegundir/page.tsx`)**

- **Current**: `pages/tegundir/index.tsx` — fully client-side with `useDepartments`, `useMainTypes` SWR hooks
- **Pattern**: `'use client'` component
- **Migration**: Replace SWR hooks with tRPC queries

**10. Users (`/notendur` → `(protected)/notendur/page.tsx`)**

- **Current**: `pages/notendur/index.tsx` — SSR fetches roles, renders dynamic `DynamicUsersPage`
- **Pattern**: Hybrid — server fetches roles + isAdmin check, passes to client
- **Migration**:
  - Server: `getServerSession` for role check, tRPC for `getRolesByUser`
  - Client: `UsersPage` component
  - `UserContext` needs rewrite: replace `next-usequerystate` → `nuqs`, replace `useUsers` SWR hook → tRPC

**11. PDF Replacement List (`/yfirskrifa-pdf` → `(protected)/yfirskrifa-pdf/page.tsx`)**

- **Current**: `pages/yfirskrifa-pdf/index.tsx` — dynamic import `AdvertReplacementTabs`
- **Pattern**: Client component
- **Migration**: Move dynamic import, inline banner

**12. PDF Replacement Detail (`/yfirskrifa-pdf/[...uid]` → `(protected)/yfirskrifa-pdf/[...uid]/page.tsx`)**

- **Current**: `pages/yfirskrifa-pdf/[...uid].tsx` — SSR fetches advert, client uses `useUpdateAdvertPDF` (file upload)
- **Pattern**: Hybrid
- **Migration**: Server fetches advert via tRPC, client handles file upload. `useUpdateAdvertPDF` stays as direct client call (no tRPC for file uploads).

**13. Advert Migration (`/auglysing-til-ritstjornar` → `(protected)/auglysing-til-ritstjornar/page.tsx`)**

- **Current**: `pages/auglysing-til-ritstjornar/index.tsx` — dynamic import `AdvertMigrationTabs`
- **Pattern**: Client component
- **Migration**: Move dynamic import, inline banner

**14. Regulation Publishing (`/reglugerd-i-ritstjorn` → `(protected)/reglugerd-i-ritstjorn/page.tsx`)**

- **Current**: `pages/reglugerd-i-ritstjorn/index.tsx` — client-side with `usePublishAdvertRegulation`
- **Pattern**: `'use client'` component
- **Migration**: Replace SWR mutation hook with tRPC mutation

**15. Error Pages**

- **Create**: `src/app/error.tsx` — `'use client'` error boundary
- **Create**: `src/app/not-found.tsx` — static 404 page
- Port error UI from `pages/_error.tsx` (AccessDenied component, status code display)

### Context Migration Summary

| Context | Current Dependencies | Migration |
|---------|---------------------|-----------|
| `CaseContext` | `useCase` (SWR), `useSignature` (SWR), direct `useSWR` for types, `useSession`, `getDmrClient` | Replace all SWR with tRPC queries. Remove direct `getDmrClient` usage. |
| `UserContext` | `useUsers` (SWR + mutations), `next-usequerystate` | Replace SWR with tRPC. `next-usequerystate` → `nuqs` (`parseAsInteger`, `useQueryState` same API, different import). |
| `CategoryContext` | `useMainCategories` (SWR), `useCategories` (SWR) | Replace SWR with tRPC queries. |
| `isSsrMobileContext` | Simple boolean context | Remove entirely — use CSS media queries or `useMediaQuery` instead. |

---

## Phase 4: Cleanup — Sub-phases

### Phase 4A: Safe Deletions (agent-cleanup-p4)

**Do these now — no component depends on them:**

Delete entirely:
- `src/pages/` — entire directory (all page files, API routes, `_app.tsx`, `_document.tsx`, `_error.tsx`)
- `src/lib/api/routeHandler.ts` — `RouteHandler` class replaced by tRPC
- `src/context/isSsrMobileContext.tsx` — SSR mobile detection, no longer needed

Modify (do NOT delete yet — `hooks/api/` still imported by 28 components):
- `src/lib/constants.ts` — remove `APIRoutes` enum, `defaultFetcher`, `fetcher`, `swrFetcher`, `OJOIWebException`. Keep `Routes` enum and `DEPARTMENTS`.

Do NOT touch yet:
- `src/hooks/api/` — 28 components still import from here → migrate in Phase 4B
- `src/hooks/users/useUsers.ts` — same reason
- `src/layout/Layout.tsx` — still wraps SWRConfig; remove after Phase 4B

Run: `yarn nx lint official-journal-web --fix` then `yarn nx run official-journal-web:tsc`

Commit: `feat(ojoi-web): Phase 4A — delete pages/ and legacy files`

---

### Phase 4B: Component Migration (SWR hooks → tRPC)

**Pattern for all components:**

```typescript
// Before (SWR hook)
import { useDepartments } from '../../hooks/api'
const { data, isLoading } = useDepartments({ page: 1 })

// After (tRPC)
import { useTRPC } from '../../lib/trpc/client/trpc'
const trpc = useTRPC()
const { data, isLoading } = trpc.cases.getDepartments.useQuery({ page: 1 })
```

**Mutation pattern:**

```typescript
// Before
import { useUpdateTitle } from '../../hooks/api'
const { trigger, isMutating } = useUpdateTitle()
await trigger({ id, title })

// After
import { useTRPC } from '../../lib/trpc/client/trpc'
const trpc = useTRPC()
const updateTitle = trpc.cases.updateTitle.useMutation()
await updateTitle.mutateAsync({ id, title })
```

**Key hook → tRPC procedure mappings:**

| Old SWR hook | tRPC procedure |
|---|---|
| `useCase(id)` | `trpc.cases.getCase.useQuery({id})` |
| `useCases(params)` | `trpc.cases.getCases.useQuery(params)` |
| `useDepartments(params)` | `trpc.cases.getDepartments.useQuery(params)` |
| `useTags()` | `trpc.cases.getTags.useQuery()` |
| `useGetPaymentStatus(id)` | `trpc.cases.getPaymentStatus.useQuery({id})` *(check router)* |
| `useUpdateTitle` | `trpc.cases.updateTitle.useMutation()` |
| `useUpdateDepartment` | `trpc.cases.updateDepartment.useMutation()` |
| `useUpdateType` | `trpc.cases.updateType.useMutation()` |
| `useUpdateTag` | `trpc.cases.updateTag.useMutation()` |
| `useUpdateEmployee` | `trpc.cases.updateEmployee.useMutation()` |
| `useUpdateFastTrack` | `trpc.cases.updateFasttrack.useMutation()` |
| `useUpdatePublishDate` | `trpc.cases.updatePublishDate.useMutation()` |
| `useUpdatePrice` | `trpc.cases.updatePrice.useMutation()` |
| `useUpdateCommunicationStatus` | `trpc.cases.updateCommunicationStatus.useMutation()` |
| `useUpdateAdvertHtml` | `trpc.cases.updateAdvertHtml.useMutation()` |
| `useUpdateAdvertAndCorrection` | `trpc.cases.updateAdvertWithCorrection.useMutation()` |
| `useRejectCase` | `trpc.cases.rejectCase.useMutation()` |
| `useUnpublish` | `trpc.cases.unpublishCase.useMutation()` |
| `useUpdateNextStatus` | `trpc.cases.updateNextStatus.useMutation()` |
| `useUpdatePreviousStatus` | `trpc.cases.updatePreviousStatus.useMutation()` |
| `useMigrateAdvertToCase` | `trpc.cases.migrateAdvertToCase.useMutation()` |
| `useAdverts(params)` | `trpc.cases.getAdvert.useQuery(params)` *(or getCases with advert filter)* |
| `useCategories(params)` | `trpc.categories.getCategories.useQuery(params)` |
| `useUpdateMainCategories` | `trpc.mainCategories.*.useMutation()` *(check router)* |
| `useMainCategories(params)` | `trpc.mainCategories.getMainCategories.useQuery(params)` |
| `useAdvertTypes(params)` | `trpc.types.getAdvertTypes.useQuery(params)` |
| `useMainTypes(params)` | `trpc.types.getMainTypes.useQuery(params)` |
| `useInstitutions(params)` | `trpc.institutions.getInstitutions.useQuery(params)` |
| `useSignature(id)` | `trpc.signatures.getSignature.useQuery({id})` |
| `useUpdateSignature` | `trpc.signatures.*.useMutation()` |
| `useUpdateSignatureDisplay` | `trpc.signatures.*.useMutation()` |
| `useAddComment` | `trpc.comments.addComment.useMutation()` |
| `useDeleteComment` | `trpc.comments.deleteComment.useMutation()` |
| `useCommunicationChannels` | `trpc.communications.getChannels.useQuery()` |
| `useGetCommunicationStatuses` | `trpc.communications.getStatuses.useQuery()` |
| `useGetAvailableInvolvedParties` | `trpc.users.getAvailableInvolvedParties.useQuery()` |
| `useUpdateInvolvedParty` | `trpc.users.updateInvolvedParty.useMutation()` |
| `useCreateAppendix` | `trpc.attachments.createAttachment.useMutation()` |
| `useDeleteAppendix` | `trpc.attachments.deleteAttachment.useMutation()` |
| `useUpdateAppendix` | `trpc.attachments.updateAttachment.useMutation()` |
| `usePublishCases` | `trpc.publish.publishCases.useMutation()` |
| `useCasesWithDepartmentCount` | `trpc.publish.getCasesWithDepartmentCount.useQuery()` |
| `useCasesWithStatusCount` | `trpc.publish.getCasesWithStatusCount.useQuery()` |
| `useCasesWithPublicationNumber` | `trpc.publish.getCasesWithPublicationNumber.useQuery()` |
| `useStatistics` | `trpc.statistics.getStatistics.useQuery()` |
| `useUsers` | `trpc.users.getUsers.useQuery()` |

> **Note**: Before writing tRPC calls, check the exact procedure names in `src/lib/trpc/server/routers/` — the table above uses likely names but verify against the actual router files.

**Reference for useTRPC import path**: `apps/official-journal-web/src/lib/trpc/client/trpc.ts`

**cache invalidation after mutations**: Use `queryClient.invalidateQueries()` pattern from `caseContext.tsx` (already rewritten with tRPC).

---

#### Phase 4B-1: case-update-fields + signature + comments + corrections (~9 files)

Agent reads: `src/lib/trpc/server/routers/casesRouter.ts`, `signaturesRouter.ts`, `commentsRouter.ts`, `communicationsRouter.ts`, `attachmentsRouter.ts`

Files to migrate:
- `src/components/case-update-fields/AdvertFields.tsx` — `useUpdateAdvertHtml`
- `src/components/case-update-fields/CommunicationChannelsField.tsx` — `useCommunicationChannels`
- `src/components/case-update-fields/PublishingFields.tsx` — `useUpdatePublishDate`, `useUpdateFastTrack`
- `src/components/case-update-fields/AppendixFields.tsx` — `useCreateAppendix`, `useDeleteAppendix`, `useUpdateAppendix`
- `src/components/case-update-fields/CommonFields.tsx` — `useUpdateTitle`, `useUpdateDepartment`, `useUpdateType`, `useUpdateTag`, `useUpdateEmployee`, `useGetAvailableInvolvedParties`, `useUpdateInvolvedParty`, `useMainTypes`
- `src/components/signature/Signature.tsx` — `useUpdateSignature`
- `src/components/signature/Signatures.tsx` — `useUpdateSignature`, `useUpdateSignatureDisplay`
- `src/components/comments/AddCommentTab.tsx` — `useAddComment`, `useCommunicationStatuses`, `useUpdateCommunicationStatus`
- `src/components/corrections/AddCorrection.tsx` — `UpdateAdvertAndCorrectionTriggerArgs` (type only → get from tRPC input type)

Commit: `feat(ojoi-web): Phase 4B-1 — migrate case-update-fields, signature, comments to tRPC`

---

#### Phase 4B-2: categories + advert-types (~9 files)

Agent reads: `src/lib/trpc/server/routers/categoriesRouter.ts`, `mainCategoriesRouter.ts`, `typesRouter.ts`

Files to migrate:
- `src/components/categories/CreateCategory.tsx` — `useUpdateMainCategories`
- `src/components/categories/UpdateCategory.tsx` — `useUpdateMainCategories`
- `src/components/categories/CreateMainCategory.tsx` — `useUpdateMainCategories`
- `src/components/categories/UpdateMainCategory.tsx` — `useUpdateMainCategories`
- `src/components/categories/MergeCategories.tsx` — `useUpdateMainCategories`
- `src/components/advert-types/CreateType.tsx` — `useAdvertTypes`, `useDepartments`, `useMainTypes`
- `src/components/advert-types/CreateMainType.tsx` — `useDepartments`, `useMainTypes`
- `src/components/advert-types/UpdateAdvertType.tsx` — `useAdvertTypes`
- `src/components/advert-types/UpdateAdvertMainType.tsx` — `useAdvertTypes`, `useMainTypes`

Commit: `feat(ojoi-web): Phase 4B-2 — migrate categories, advert-types to tRPC`

---

#### Phase 4B-3: case-filters + tabs + tables (~10 files)

Agent reads: `src/lib/trpc/server/routers/publishRouter.ts`, `typesRouter.ts`, `categoriesRouter.ts`, `casesRouter.ts`

Files to migrate:
- `src/components/case-filters/CategoriesFilter.tsx` — `useCategories`
- `src/components/case-filters/DepartmentsFilter.tsx` — `useDepartments`
- `src/components/case-filters/TypesFilter.tsx` — direct `useSWR` → `trpc.types.getAdvertTypes.useQuery()`
- `src/components/tabs/CaseReadyForPublicationTabs.tsx` — multiple hooks
- `src/components/tabs/CasePublishedTabs.tsx` — `useCasesWithDepartmentCount`
- `src/components/tabs/AdvertMigrationTabs.tsx` — `useAdverts`
- `src/components/tabs/AdvertReplacementTabs.tsx` — `useAdverts`
- `src/components/tabs/CaseOverviewTabs.tsx` — `useCasesWithStatusCount`
- `src/components/tables/InstitutionTable.tsx` — `useInstitutions`
- `src/components/tables/AdvertMigrationTable.tsx` — `useMigrateAdvertToCase`

Commit: `feat(ojoi-web): Phase 4B-3 — migrate case-filters, tabs, tables to tRPC`

---

#### Phase 4B-4: users + create-case + price + form + layout (~6 files)

Agent reads: `src/lib/trpc/server/routers/usersRouter.ts`, `institutionsRouter.ts`, `casesRouter.ts`

Files to migrate:
- `src/components/users/CreateInstitution.tsx` — `useInstitutions`
- `src/components/users/InstitutionDetailed.tsx` — `useInstitutions`
- `src/components/create-case/CreateCase.tsx` — `useCase`, `useDepartments`, `useInstitutions`, `useMainTypes`
- `src/components/price/calculator.tsx` — `useGetPaymentStatus`, `useUpdatePrice`
- `src/components/form/FormShell.tsx` — multiple hooks (read file first to identify)
- `src/layout/Layout.tsx` — remove `SWRConfig` wrapper (components no longer need SWR context)

Commit: `feat(ojoi-web): Phase 4B-4 — migrate users, create-case, price, form to tRPC`

---

### Phase 4C: Final Cleanup

**Only run after ALL 4B batches pass tsc.**

Delete entirely:
- `src/hooks/api/` — all SWR hooks (all consumers migrated in 4B)
- `src/lib/constants-legacy.ts` — the legacy constants extracted by Phase 4A (APIRoutes, fetcher, swrFetcher, OJOIWebException). Only used by hooks/api/.

Already deleted in Phase 4A (no action needed):
- `src/pages/api/` — deleted (was ~50 route handler files)
- `src/lib/api/routeHandler.ts` — deleted
- `src/lib/handlers/` — deleted

NOTE: `pages/api/health.ts` was deleted in Phase 4A. If load balancers need it, create `src/app/api/health/route.ts` as a simple 200 OK handler.

Run:
```bash
yarn nx lint official-journal-web --fix
yarn nx run official-journal-web:tsc
yarn nx build official-journal-web
```

Consider removing `swr` from `package.json` if no other workspace packages depend on it (check with `grep -r "from 'swr'" apps/ libs/`).

Commit: `feat(ojoi-web): Phase 4C — delete hooks/api/, pages/api/, complete SWR removal`

---

### Phase 4A — What was done (committed)

Files deleted:
- `src/pages/` front-end routes: `_app.tsx`, `_document.tsx`, `_error.tsx`, `index.tsx`, `innskraning.tsx`, all page subdirectories
- `src/pages/api/auth/` (replaced by `src/app/api/auth/`)
- `src/layout/Layout.tsx` + entire `layout/` directory
- `src/context/isSsrMobileContext.tsx`
- `src/hooks/users/useUsers.ts`

Import fixes applied (tsc now passes):
- `next/router` → `next/navigation` in: `page-loader.tsx` (full rewrite — removed router.events, uses usePathname + useSearchParams), `CreateCase.tsx`, `useUpdateAdvertPDF.ts`
- `next-usequerystate` → `nuqs` in: `Users.tsx`, `useSearchParams.ts`, `CaseReadyForPublicationTabs.tsx`, `CaseTable.tsx`, `UsersTable.tsx`, `InstitutionTable.tsx`

Still present (cannot delete yet):
- `src/pages/api/` — ~50 route files still serving SWR hooks. Cannot delete until 4B components migrate.
- `src/hooks/api/` — 32 component consumers remain

---

## Verification Checklist

### Build

```bash
yarn nx run official-journal-web:tsc    # Type check
yarn nx build official-journal-web       # Production build
```

### Runtime Testing

1. Start API: `yarn nx serve official-journal-api`
2. Start web: `yarn nx serve official-journal-web`
3. Test each page:

| Route | Expected Behavior |
|-------|-------------------|
| `/innskraning` | Login page renders, signIn works |
| `/` | Dashboard with statistics tabs, overview lists |
| `/ritstjorn?status=Grunnvinnsla` | Case processing overview with tabs |
| `/ritstjorn/<case-id>` | Case detail with all fields, CaseProvider works |
| `/utgafa` | Publishing overview with department tabs |
| `/utgafa/stadfesting?caseIds=...&department=a-deild` | Confirm publishing, mutation works |
| `/heildaryfirlit?department=a-deild` | Published cases overview |
| `/yfirflokkar` | Categories CRUD |
| `/tegundir` | Types CRUD |
| `/notendur` | Users management (admin vs non-admin) |
| `/yfirskrifa-pdf` | PDF replacement list |
| `/yfirskrifa-pdf/<advert-id>` | PDF upload works |
| `/auglysing-til-ritstjornar` | Advert migration tabs |
| `/reglugerd-i-ritstjorn` | Regulation publishing |

4. Test middleware:
   - Non-admin user redirected to `/notendur` from admin-only routes
   - Token refresh works (wait for session timeout)
   - Unauthenticated user redirected to `/innskraning`

### Code Quality

```bash
yarn nx lint official-journal-web        # ESLint (check logging-next rule)
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Middleware composition breaks | Fallback: write inline middleware using `isExpired`/`refreshAccessToken`/`updateCookie` from `@dmr.is/auth/middleware-helpers` |
| CaseContext rewrite breaks case detail page | Keep SWR temporarily for CaseContext if tRPC migration is too complex; migrate later |
| Generated types mismatch with tRPC Zod schemas | Use `.passthrough()` on Zod schemas; validate only critical input fields |
| `useUpdateAdvertPDF` file upload | Keep as direct client-to-API call (no tRPC) |
| SSR/hydration mismatches | Avoid `Date`, `Math.random()` in server components; use `suppressHydrationWarning` only when necessary |
| `next-usequerystate` → `nuqs` API differences | API is nearly identical (same author); main change is import path |
| Vanilla Extract + App Router issues | Keep `withVanillaExtract` plugin; test with turbopack and webpack |
| Bundle size regression from React Query | `optimizePackageImports` for `@tanstack/react-query` in next.config.js |

---

## Commit Strategy

| Commit | Content |
|--------|---------|
| 1 | Phase 1: Infrastructure (auth, middleware, providers, tRPC scaffolding, root layout) ✅ c02b73b4 |
| 2 | Phase 2: All tRPC routers ✅ 220fad59 |
| 3 | Phase 3: Page migrations (all 15 pages) ✅ 857a489e |
| 4A | Phase 4A: Delete pages/ and legacy files |
| 4B-1 | Phase 4B-1: Migrate case-update-fields, signature, comments to tRPC |
| 4B-2 | Phase 4B-2: Migrate categories, advert-types to tRPC |
| 4B-3 | Phase 4B-3: Migrate case-filters, tabs, tables to tRPC |
| 4B-4 | Phase 4B-4: Migrate users, create-case, price, form to tRPC |
| 4C | Phase 4C: Delete hooks/api/, complete SWR removal |
| 5 | Phase 4: Fix lint/type/build issues |
