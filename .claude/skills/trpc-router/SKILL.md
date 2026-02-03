---
name: trpc-router
description: Create and register tRPC routers with procedures in Legal Gazette APIs. Use when adding new backend tRPC endpoints, procedures, or when setting up tRPC routing.
---

# tRPC Router Creator

Create properly structured tRPC routers following the Legal Gazette backend patterns.

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

## Key Architecture Details

### Flat Router Merging

**CRITICAL**: Routers use `mergeRouters()` (flat merge), NOT nested `router({ sub: subRouter })`.

All procedure names are top-level:
- ✅ **Correct**: `trpc.getHello`
- ❌ **Wrong**: `trpc.hello.get`

### Import Conventions

- **Relative imports**: Apps use relative imports (`../../lib/trpc/client/server`), not `@/` path aliases
- **Server-side `trpc` proxy**: Server Components import `trpc` directly from `../../lib/trpc/client/server`
- **Client-side `useTRPC()` hook**: Client components get the tRPC instance via `useTRPC()` hook, NOT a direct import

### Context

The tRPC context creates an `api` property from `getServerClient()`, which wraps the generated OpenAPI client. This allows tRPC procedures to call backend APIs.

## Creating a New tRPC Router

### Step 1: Identify the App

Determine which Legal Gazette app needs the router:
- `legal-gazette-web` (port 4200)
- `legal-gazette-application-web` (port 4300)
- `legal-gazette-public-web` (port 4400)

### Step 2: Create the Router File

Create at `apps/{app}/src/lib/trpc/server/routers/{name}Router.ts`:

```typescript
import { publicProcedure, router } from '../trpc'

export const featureRouter = router({
  getFeature: publicProcedure.query(() => {
    return { message: 'Hello' }
  }),
})
```

### Step 3: Choose Procedure Type

**publicProcedure** - No authentication required
```typescript
export const publicRouter = router({
  getPublicData: publicProcedure.query(() => {
    return { data: 'Public info' }
  }),
})
```

**protectedProcedure** - Requires authentication
```typescript
export const protectedRouter = router({
  getUserData: protectedProcedure.query(async ({ ctx }) => {
    // ctx.session contains authenticated user info
    return { userId: ctx.session.user.id }
  }),
})
```

### Step 4: Add Input Validation

Use Zod for input validation:

```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const featureRouter = router({
  getFeatureById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Access validated input
      const feature = await ctx.api.getFeature({ id: input.id })
      return feature
    }),

  createFeature: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newFeature = await ctx.api.createFeature(input)
      return newFeature
    }),
})
```

### Step 5: Register in _app.ts

Add to `mergeRouters()` in `src/lib/trpc/server/routers/_app.ts`:

```typescript
import { mergeRouters } from '../trpc'
import { featureRouter } from './featureRouter'
import { existingRouter1 } from './existingRouter1'
import { existingRouter2 } from './existingRouter2'

export const appRouter = mergeRouters(
  existingRouter1,
  existingRouter2,
  featureRouter, // Add new router here
)

export type AppRouter = typeof appRouter
```

**IMPORTANT**: After merging, all procedures are available at the top level:
- `trpc.getFeature` (from featureRouter)
- `trpc.createFeature` (from featureRouter)
- All other procedures from existing routers

## Common Patterns

### Query Procedure (Read)

```typescript
getItems: publicProcedure.query(async ({ ctx }) => {
  const items = await ctx.api.getAllItems()
  return items
})
```

### Query with Input

```typescript
getItemById: publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input, ctx }) => {
    const item = await ctx.api.getItem({ id: input.id })
    return item
  })
```

### Mutation Procedure (Create/Update/Delete)

```typescript
createItem: protectedProcedure
  .input(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const newItem = await ctx.api.createItem({
      ...input,
      userId: ctx.session.user.id,
    })
    return newItem
  })
```

### Mutation with Complex Input

```typescript
updateItem: protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(['draft', 'published']).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input
    const updated = await ctx.api.updateItem({ id, ...updateData })
    return updated
  })
```

### Delete Mutation

```typescript
deleteItem: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    await ctx.api.deleteItem({ id: input.id })
    return { success: true }
  })
```

## Error Handling

tRPC automatically handles errors. For custom errors:

```typescript
import { TRPCError } from '@trpc/server'

getItem: publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input, ctx }) => {
    const item = await ctx.api.getItem({ id: input.id })

    if (!item) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Item not found',
      })
    }

    return item
  })
```

**Common error codes**:
- `NOT_FOUND` - Resource doesn't exist
- `BAD_REQUEST` - Invalid input
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Authenticated but not authorized
- `INTERNAL_SERVER_ERROR` - Server error

## Context Usage

Access authenticated user info via context:

```typescript
getUserProfile: protectedProcedure.query(async ({ ctx }) => {
  // ctx.session available in protectedProcedure
  const profile = await ctx.api.getUserProfile({
    userId: ctx.session.user.id,
  })
  return profile
})
```

Access API client via context:

```typescript
getData: publicProcedure.query(async ({ ctx }) => {
  // ctx.api wraps the OpenAPI-generated client
  const data = await ctx.api.getSomeData()
  return data
})
```

## Checklist

When creating a new tRPC router:

- [ ] Create router file at `src/lib/trpc/server/routers/{name}Router.ts`
- [ ] Use appropriate procedure type (`publicProcedure` or `protectedProcedure`)
- [ ] Add Zod input validation for all procedures with parameters
- [ ] Use `.query()` for read operations (GET)
- [ ] Use `.mutation()` for write operations (POST/PUT/DELETE)
- [ ] Import and merge in `_app.ts` using `mergeRouters()`
- [ ] Verify all procedure names are unique across all routers
- [ ] Test that procedures are accessible at top level (e.g., `trpc.getProcedure`)

## Next Steps

After creating the router:
- Use `/nextjs-page` skill to create frontend pages that consume these procedures
- Test the endpoints using the frontend or API testing tools
- Add error handling and logging as needed
