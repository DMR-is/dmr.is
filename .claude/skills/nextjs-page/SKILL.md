---
name: nextjs-page
description: Create Next.js App Router pages with tRPC data fetching, loading states, and component architecture. Use when creating new pages in Legal Gazette apps, or when implementing list/detail/form page patterns with tRPC.
---

# Next.js Page Creator

Create properly structured Next.js App Router pages with tRPC data fetching, following established patterns for different page types.

## Prerequisites

Before using this skill, ensure tRPC routers are created. Use the `/trpc-router` skill to create backend procedures first if needed.

## Core Workflow

Follow these steps in order:

### 1. Gather Requirements

Ask clarifying questions to determine the appropriate pattern:

1. **What type of page?** (list, detail, form, dashboard)
2. **Does it need mutations?** (create, update, delete operations)
3. **Which app?** (legal-gazette-web, legal-gazette-application-web, legal-gazette-public-web)
4. **Multiple data sections?** (affects Suspense boundaries)
5. **Reusable components?** (affects file location: colocate in app/ or separate in containers/components/)
6. **Which tRPC procedures to use?** (or use `/trpc-router` to create them)

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
- Page-specific components → colocate in `app/{route}/_components/`
- Reused across pages → separate `containers/` and `components/` folders

### 4. Implement Key Elements

Every page needs:

#### page.tsx (Server Component)

```tsx
import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { trpc } from '../../lib/trpc/client/server'

export default async function ExamplePage() {
  // Prefetch data on server
  prefetch(trpc.getData.queryOptions())

  return (
    <HydrateClient>
      <ExampleContainer />
    </HydrateClient>
  )
}
```

**Key points**:
- Import `{ HydrateClient, prefetch }` from `@dmr.is/trpc/client/server`
- Import `{ trpc }` from **relative path** to `lib/trpc/client/server`
- Use `prefetch()` to load data on server
- Wrap in `<HydrateClient>` to hydrate client-side
- Use `notFound()` for 404s on detail pages
- Use `fetchQueryWithHandler()` when you need the data server-side

#### loading.tsx

```tsx
import { GridContainer, LoadingDots, Stack } from '@dmr.is/ui/components/island-is'

export default function Loading() {
  return (
    <GridContainer>
      <Stack space={3}>
        <LoadingDots />
      </Stack>
    </GridContainer>
  )
}
```

#### Container (Client Component)

```tsx
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { GridContainer, Stack } from '@dmr.is/ui/components/island-is'
import { useTRPC } from '../../lib/trpc/client/trpc'

export function ExampleContainer() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.getData.queryOptions())

  return (
    <GridContainer>
      <Stack space={3}>
        {/* Render data */}
      </Stack>
    </GridContainer>
  )
}
```

**Key points**:
- Mark with `'use client'`
- Import `{ useTRPC }` from **relative path** to `lib/trpc/client/trpc`
- Call `const trpc = useTRPC()` inside the component
- Use `useSuspenseQuery()` or `useQuery()` from `@dmr.is/trpc/client/trpc`
- Use `useMutation()` from `@tanstack/react-query` for mutations

### 5. Apply Styling

Use Island.is design system components:

```tsx
import {
  Box,
  Button,
  GridContainer,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
```

See `references/styling.md` for complete styling guidelines.

**Common patterns**:
- `GridContainer` for page-level containment
- `Stack` for vertical spacing (space prop: 1-10)
- `Box` with flex props for horizontal layouts

### 6. Add Error Handling

**Server Components**:
```tsx
import { notFound } from 'next/navigation'

const item = await fetchQueryWithHandler(trpc.getItem.queryOptions({ id }))
if (!item) {
  notFound()
}
```

**Client Components**:
```tsx
import { toast } from '@dmr.is/ui/components/island-is'

const mutation = useMutation(
  trpc.deleteItem.mutationOptions({
    onSuccess: () => {
      toast.success('Item deleted')
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`)
    },
  }),
)
```

## Common Imports

### Server Components (page.tsx)

```tsx
import { HydrateClient, prefetch, fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { trpc } from '../../lib/trpc/client/server' // relative path from page location
import { notFound } from 'next/navigation'
```

### Client Components (containers, components)

```tsx
import { useSuspenseQuery, useQuery } from '@dmr.is/trpc/client/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '../lib/trpc/client/trpc' // relative path from container location
import {
  Box,
  Button,
  GridContainer,
  LoadingDots,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
```

**IMPORTANT**: All internal app imports use **relative paths**. Only shared library imports use `@dmr.is/*` or `@island.is/*` aliases.

## Data Fetching Patterns

### Server-Side Prefetch (Most Common)

Prefetch data on server, query on client:

```tsx
// page.tsx (Server Component)
export default async function Page() {
  prefetch(trpc.getData.queryOptions())
  return (
    <HydrateClient>
      <Container />
    </HydrateClient>
  )
}

// Container.tsx (Client Component)
'use client'
export function Container() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.getData.queryOptions())
  return <div>{data.title}</div>
}
```

### Server-Side Fetch

Fetch data on server and check before rendering:

```tsx
// page.tsx (Server Component)
export default async function Page({ params }: Props) {
  const { id } = await params
  const item = await fetchQueryWithHandler(trpc.getItem.queryOptions({ id }))

  if (!item) {
    notFound()
  }

  return (
    <HydrateClient>
      <Container id={id} />
    </HydrateClient>
  )
}
```

### Client-Side Only

For dynamic data that doesn't need SSR:

```tsx
'use client'
export function Container() {
  const trpc = useTRPC()
  const { data, isLoading } = useQuery(trpc.getData.queryOptions())

  if (isLoading) return <LoadingDots />
  return <div>{data.title}</div>
}
```

## Mutations

### Basic Mutation

```tsx
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function Container() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation(
    trpc.deleteItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.getAllItems.queryKey() })
        toast.success('Deleted')
      },
      onError: (error) => {
        toast.error(`Failed: ${error.message}`)
      },
    }),
  )

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id })
  }

  return <Button onClick={() => handleDelete('123')}>Delete</Button>
}
```

### Form with Mutation

```tsx
'use client'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function FormContainer() {
  const trpc = useTRPC()
  const router = useRouter()
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation(
    trpc.createItem.mutationOptions({
      onSuccess: (data) => {
        toast.success('Created')
        router.push(`/items/${data.id}`)
      },
    }),
  )

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values)
  }

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack space={3}>
          <Input
            label="Title"
            {...methods.register('title')}
            errorMessage={methods.formState.errors.title?.message}
            required
          />
          <Button type="submit" loading={createMutation.isPending}>
            Create
          </Button>
        </Stack>
      </Box>
    </FormProvider>
  )
}
```

## Quick Reference

- **Detailed page patterns** → `references/patterns.md`
- **Styling guidelines** → `references/styling.md`
- **Create tRPC routers** → Use `/trpc-router` skill

## Checklist

When creating a new Next.js page:

- [ ] Determine page type (list, detail, form, dashboard)
- [ ] Ensure required tRPC procedures exist (use `/trpc-router` if not)
- [ ] Create `page.tsx` (Server Component) with `prefetch` and `HydrateClient`
- [ ] Create `loading.tsx` with loading skeleton
- [ ] Create Container (Client Component) with `useTRPC()` and queries
- [ ] Add mutations if needed with proper invalidation
- [ ] Use Island.is components for UI
- [ ] Add error handling (notFound, toast)
- [ ] Use relative imports for app-internal files
- [ ] Test loading states and error cases
