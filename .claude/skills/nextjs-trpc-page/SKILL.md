---
name: nextjs-trpc-page
description: Create Next.js App Router pages with proper tRPC data fetching, loading states, and component architecture. Use when the user asks to create, build, or scaffold a new page in a Next.js application that uses tRPC, or when they need guidance on page structure, data fetching patterns, mutations, forms, or component organization for Next.js + tRPC projects.
---

# Next.js tRPC Page Creator

Create properly structured Next.js App Router pages with tRPC data fetching, following established patterns for different page types.

## Project tRPC Setup

All Legal Gazette App Router apps (`legal-gazette-web`, `legal-gazette-application-web`, `legal-gazette-public-web`) share the same tRPC file structure and patterns.

### File Locations (per app)

```
src/lib/trpc/
├── client/
│   ├── trpc.ts          # Client-side hook: exports useTRPC() and TRPCProvider
│   ├── server.tsx       # Server-side proxy: exports trpc (for Server Components)
│   └── Provider.tsx     # React provider wrapping <TRPCProvider> + QueryClient
└── server/
    ├── trpc.ts          # tRPC init: exports router, publicProcedure, protectedProcedure, mergeRouters
    └── routers/
        ├── _app.ts      # Root router: mergeRouters(...) + exports AppRouter type
        └── {name}Router.ts  # Individual feature routers
```

### Key Architecture Details

- **Flat router merging**: Routers use `mergeRouters()` (flat merge), NOT nested `router({ sub: subRouter })`. All procedure names are top-level (e.g., `trpc.getHello`, not `trpc.hello.get`).
- **Relative imports**: Apps use relative imports (`../../lib/trpc/client/server`), not `@/` path aliases.
- **Client-side `useTRPC()` hook**: Client components get the tRPC instance via `useTRPC()` hook, NOT a direct import.
- **Server-side `trpc` proxy**: Server Components import `trpc` directly from `../../lib/trpc/client/server`.
- **Context provides `api`**: The tRPC context creates an `api` property from `getServerClient()`, which wraps the generated OpenAPI client.

### Creating a New tRPC Router

1. **Create the router file** at `src/lib/trpc/server/routers/{name}Router.ts`:

```typescript
import { publicProcedure, router } from '../trpc'

export const featureRouter = router({
  getFeature: publicProcedure.query(() => {
    return { message: 'Hello' }
  }),
})
```

Use `protectedProcedure` instead of `publicProcedure` when the route requires authentication.

2. **Register in `_app.ts`** by adding to `mergeRouters()`:

```typescript
import { mergeRouters } from '../trpc'
import { featureRouter } from './featureRouter'
// ... other imports

export const appRouter = mergeRouters(
  // ... existing routers,
  featureRouter,
)
```

## Core Workflow

Follow these steps in order:

### 1. Gather Requirements

Ask clarifying questions to determine the appropriate pattern:

1. **What type of page?** (list, detail, form, dashboard)
2. **Does it need mutations?** (create, update, delete operations)
3. **Which app?** (identify the specific Next.js app in the monorepo)
4. **Multiple data sections?** (affects Suspense boundaries)
5. **Reusable components?** (affects file location: colocate in app/ or separate in containers/components/)
6. **Does it need a new tRPC router?** (or can it use existing procedures)

### 2. Select Pattern

Based on requirements, choose the appropriate pattern from `references/patterns.md`:

- **Simple List** - Read-only collection display
- **Interactive List** - List with mutations (delete, bulk actions)
- **Simple Detail** - Single item display, no editing
- **Interactive Detail** - Detail page with edit/delete
- **Form** - Create or edit forms with validation
- **Multi-Section** - Dashboard with multiple independent data sources

### 3. Implement Structure

Follow the standard file structure:

```
app/
└── (protected)/
    └── {route-name}/
        ├── page.tsx              # Server Component with prefetch
        ├── loading.tsx           # Route-level loading skeleton
        └── [id]/                 # Dynamic routes if needed
            ├── page.tsx
            └── loading.tsx

containers/
└── {feature}/
    └── {Feature}Container.tsx    # Client Component with tRPC hooks

components/
└── {feature}/
    └── {Feature}Card.tsx         # Presentational components
```

**Location rules:**
- Page-specific → colocate in `app/{route}/_components/`
- Reused across pages → separate `containers/` and `components/` folders

### 4. Implement Key Elements

Every page needs:

1. **page.tsx** (Server Component)
   - Import `{ HydrateClient, prefetch }` from `@dmr.is/trpc/client/server`
   - Import `{ trpc }` from relative path to `lib/trpc/client/server`
   - Use `prefetch()` for data
   - Wrap in `<HydrateClient>`
   - Use `notFound()` for 404s on detail pages

2. **loading.tsx**
   - Use Island.is components: `GridContainer`, `Stack`, `LoadingDots`

3. **Container** (Client Component)
   - Mark with `'use client'`
   - Import `{ useTRPC }` from relative path to `lib/trpc/client/trpc`
   - Call `const trpc = useTRPC()` inside the component
   - Use `useSuspenseQuery()` or `useQuery()` from `@dmr.is/trpc/client/trpc`
   - Use `useMutation()` from `@tanstack/react-query` for mutations

4. **Components**
   - Use Island.is UI library: `Box`, `Stack`, `Text`, `Button`, etc.
   - Import from `@dmr.is/ui/components/island-is`

### 5. Apply Styling

Use Island.is design system:
- `GridContainer` for page-level containment
- `Stack` for vertical spacing (space prop: 1-10)
- `Box` with flex props for horizontal layouts
- Follow spacing scale in `references/styling.md`

### 6. Add Error Handling

- Server: `notFound()` from `next/navigation`
- Client: `toast.error()` and `toast.success()` from Island.is
- Mutations: `onError` and `onSuccess` callbacks

## Quick Reference

See detailed implementations in:
- **references/patterns.md** - All page patterns with complete code examples
- **references/styling.md** - Island.is component usage and spacing guidelines

## Common Imports

```tsx
// Server Components (page.tsx)
import { HydrateClient, prefetch, fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { trpc } from '../../lib/trpc/client/server' // relative path from page location
import { notFound } from 'next/navigation'

// Client Components (containers, components)
import { useSuspenseQuery, useMutation } from '@dmr.is/trpc/client/trpc'
import { useQuery } from '@dmr.is/trpc/client/trpc' // alternative for non-suspense queries
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '../lib/trpc/client/trpc' // relative path from container location
import { GridContainer, Stack, Box, Text, Button, toast, LoadingDots } from '@dmr.is/ui/components/island-is'
```

**Important**: All internal app imports use relative paths. Only shared library imports use `@dmr.is/*` or `@island.is/*` aliases.
