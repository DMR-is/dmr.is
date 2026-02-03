# Next.js Conventions

This guide provides a quick reference for Next.js patterns in the DMR.is monorepo. **For comprehensive architecture details**, see [nextjs-architecture-guide.md](../../.github/nextjs-architecture-guide.md).

## Quick Reference

### App Router vs Pages Router

| Application | Router | Status |
|-------------|--------|--------|
| Legal Gazette Web | App Router | Modern, recommended pattern |
| Legal Gazette Application Web | App Router | Modern, recommended pattern |
| Legal Gazette Public Web | App Router | Modern, recommended pattern |
| Official Journal Web | Pages Router | Legacy, stable |

**Use App Router** for all new applications.

## Server vs Client Components

### Decision Tree

```
Need interactivity/hooks/browser APIs?
├─ Yes → Client Component ('use client')
└─ No  → Server Component (default in App Router)
```

### Server Components (Default)

**Use when**:
- Fetching data from APIs/databases
- Accessing backend resources directly
- No user interaction needed
- Rendering static content

**Features**:
- Can be `async`
- Direct database/API access
- Reduced bundle size (runs on server)
- No browser APIs

**Example**:
```typescript
// app/adverts/[id]/page.tsx
import { trpc } from '@/lib/trpc/server'

// Server Component - can be async
export default async function AdvertPage({
  params,
}: {
  params: { id: string }
}) {
  // Direct tRPC call on server
  const advert = await trpc.advert.getById({ id: params.id })

  if (!advert) {
    notFound()
  }

  return (
    <div>
      <h1>{advert.title}</h1>
      <p>{advert.description}</p>
    </div>
  )
}
```

### Client Components ('use client')

**Use when**:
- Need React hooks (useState, useEffect, etc.)
- Handling user interactions (onClick, onChange, etc.)
- Using browser APIs (window, localStorage, etc.)
- Rendering context providers

**Features**:
- Can use hooks and event handlers
- Runs in browser (increased bundle size)
- No direct database access
- Can import Server Components as children

**Example**:
```typescript
'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export function AdvertForm() {
  const [title, setTitle] = useState('')

  const createMutation = trpc.advert.create.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync({ title })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit">Create</button>
    </form>
  )
}
```

## App Router Patterns

### File Conventions

| File | Purpose | Component Type |
|------|---------|---------------|
| `layout.tsx` | Shared UI for routes | Server (can have client children) |
| `page.tsx` | Route page | Server by default |
| `loading.tsx` | Loading UI | Server |
| `error.tsx` | Error boundary | **Client** (must use 'use client') |
| `not-found.tsx` | 404 page | Server |
| `route.ts` | API endpoint | N/A |

### Route Groups

Use parentheses for grouping without affecting URL:

```
app/
├── (protected)/          # Auth required, no /protected in URL
│   ├── layout.tsx        # Shared layout with auth check
│   ├── ritstjorn/
│   │   └── page.tsx      # URL: /ritstjorn
│   └── stillingar/
│       └── page.tsx      # URL: /stillingar
│
└── (public)/             # Public pages, no /public in URL
    ├── leit/
    │   └── page.tsx      # URL: /leit
    └── sidur/
        └── page.tsx      # URL: /sidur
```

### Layouts

**Root Layout** (required):
```typescript
// app/layout.tsx
import { Providers } from '@/components/Providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="is">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Nested Layout**:
```typescript
// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      <nav>{/* Protected nav */}</nav>
      {children}
    </div>
  )
}
```

## Data Fetching

### Server Components (Recommended)

Fetch directly in async Server Components:

```typescript
// app/adverts/page.tsx
import { trpc } from '@/lib/trpc/server'

export default async function AdvertsPage() {
  const adverts = await trpc.advert.list()

  return (
    <div>
      {adverts.map((advert) => (
        <AdvertCard key={advert.id} advert={advert} />
      ))}
    </div>
  )
}
```

### Client Components (Interactive)

Use tRPC React Query hooks:

```typescript
'use client'

import { trpc } from '@/lib/trpc/client'

export function AdvertsList() {
  const { data: adverts, isLoading } = trpc.advert.list.useQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {adverts?.map((advert) => (
        <AdvertCard key={advert.id} advert={advert} />
      ))}
    </div>
  )
}
```

### Mutations

Always use Client Components for mutations:

```typescript
'use client'

import { trpc } from '@/lib/trpc/client'

export function DeleteAdvertButton({ id }: { id: string }) {
  const utils = trpc.useContext()
  const deleteMutation = trpc.advert.delete.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.advert.list.invalidate()
    },
  })

  return (
    <button
      onClick={() => deleteMutation.mutate({ id })}
      disabled={deleteMutation.isLoading}
    >
      Delete
    </button>
  )
}
```

## Pages Router Patterns (Legacy)

### Data Fetching

Use `getServerSideProps` for server-side data:

```typescript
// pages/adverts/[id].tsx
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!
  const advert = await getAdvert(id)

  if (!advert) {
    return { notFound: true }
  }

  return {
    props: { advert },
  }
}

export default function AdvertPage({ advert }) {
  return <div>{advert.title}</div>
}
```

### API Routes

```typescript
// pages/api/adverts/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query

  if (req.method === 'GET') {
    const advert = await getAdvert(id as string)
    return res.status(200).json(advert)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

## Common Patterns

### Provider Pattern

Client Components that provide context:

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { TRPCProvider } from '@/lib/trpc/client/Provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
      </TRPCProvider>
    </SessionProvider>
  )
}
```

### Container Pattern

Separate data fetching from presentation:

```typescript
// Server Component - fetch data
// app/adverts/[id]/page.tsx
export default async function AdvertPage({ params }) {
  const advert = await trpc.advert.getById({ id: params.id })

  return <AdvertContainer advert={advert} />
}

// Client Component - interactivity
// containers/AdvertContainer.tsx
'use client'

export function AdvertContainer({ advert }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div>
      {isEditing ? (
        <AdvertForm advert={advert} />
      ) : (
        <AdvertDetail advert={advert} />
      )}
    </div>
  )
}
```

### Form Pattern

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function AdvertForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = trpc.advert.create.useMutation()

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}

      <textarea {...register('description')} />

      <button type="submit" disabled={createMutation.isLoading}>
        Create
      </button>
    </form>
  )
}
```

## Middleware

**Always use `@dmr.is/logging-next`** in middleware (Edge Runtime compatible):

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLogger } from '@dmr.is/logging-next'

const logger = getLogger('Middleware')

export function middleware(request: NextRequest) {
  logger.info('Request received', {
    path: request.nextUrl.pathname,
  })

  return NextResponse.next()
}

export const config = {
  matcher: ['/ritstjorn/:path*'],
}
```

## Common Pitfalls

### ❌ Using Hooks in Server Components

```typescript
// Wrong - can't use hooks in Server Components
export default function Page() {
  const [state, setState] = useState(false) // Error!
  return <div>...</div>
}

// Correct - mark as Client Component
'use client'

export default function Page() {
  const [state, setState] = useState(false) // Works!
  return <div>...</div>
}
```

### ❌ Forgetting 'async' in Server Components

```typescript
// Wrong - missing async
export default function Page() {
  const data = await fetchData() // Error!
  return <div>{data}</div>
}

// Correct - Server Component can be async
export default async function Page() {
  const data = await fetchData() // Works!
  return <div>{data}</div>
}
```

### ❌ Wrong Logger in Edge Runtime

```typescript
// Wrong - @dmr.is/logging doesn't work in Edge Runtime
import { getLogger } from '@dmr.is/logging'

// Correct - use @dmr.is/logging-next
import { getLogger } from '@dmr.is/logging-next'
```

### ❌ Passing Non-Serializable Props

```typescript
// Wrong - can't pass functions to Client Components
<ClientComponent onClick={() => console.log('test')} />

// Correct - define handler in Client Component
// Parent (Server Component)
<ClientComponent data={data} />

// ClientComponent (Client Component)
'use client'
export function ClientComponent({ data }) {
  const handleClick = () => console.log(data)
  return <button onClick={handleClick}>Click</button>
}
```

## Best Practices

1. **Default to Server Components**: Only use 'use client' when needed
2. **Fetch High in the Tree**: Fetch in Server Components, pass to Client Components
3. **Use Route Groups**: Organize routes without affecting URLs
4. **Leverage Layouts**: Share UI and reduce duplication
5. **Use loading.tsx**: Provide instant loading feedback
6. **Use error.tsx**: Handle errors gracefully with boundaries
7. **Proper Logger**: Use `@dmr.is/logging-next` in Next.js apps
8. **Type Safety**: Use TypeScript for props and API responses

## Performance Tips

1. **Minimize Client Components**: Reduce JavaScript bundle size
2. **Use Streaming**: Return JSX immediately, stream data
3. **Parallel Data Fetching**: Fetch multiple resources in parallel
4. **Cache Responses**: Use Next.js caching strategies
5. **Lazy Load Components**: Use `next/dynamic` for heavy components

---

**Related Documentation**:
- **[Full Next.js Architecture Guide](../../.github/nextjs-architecture-guide.md)** - Comprehensive patterns and examples
- [Logging Conventions](./logging.md) - Which logger to use
- [Testing Conventions](./testing.md) - Testing Next.js components
- [Legal Gazette Apps](../apps/legal-gazette/CLAUDE.md) - App Router examples
- [Official Journal Apps](../apps/official-journal/CLAUDE.md) - Pages Router examples
