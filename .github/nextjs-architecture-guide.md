# Next.js Architecture Guide for DMR.is Monorepo

## Overview

This guide outlines best practices for structuring Next.js applications in the DMR.is monorepo. We use both **Pages Router** (legacy apps) and **App Router** (modern apps), with emphasis on the App Router pattern going forward.

## Table of Contents

1. [Pages Router vs App Router](#pages-router-vs-app-router)
2. [App Router Best Practices](#app-router-best-practices)
3. [Server Components vs Client Components](#server-components-vs-client-components)
4. [File Organization](#file-organization)
5. [Data Fetching Patterns](#data-fetching-patterns)
6. [Routing Patterns](#routing-patterns)
7. [Common Patterns in DMR.is](#common-patterns-in-dmris)

## Pages Router vs App Router

### When to Use Each

| Feature | Pages Router | App Router |
|---------|-------------|------------|
| New Applications | ❌ Legacy | ✅ Recommended |
| Server Components | ❌ No | ✅ Yes |
| Data Fetching | `getServerSideProps` | Async components |
| Layouts | Manual HOCs | Nested layouts |
| Loading States | Custom | `loading.tsx` |
| Error Handling | `_error.tsx` | `error.tsx` boundaries |
| Bundle Size | Larger | Smaller (server components) |
| Performance | Good | Better |

**Current Status**:
- **Official Journal Web**: Pages Router (stable, no migration planned)
- **Legal Gazette Web**: App Router (modern pattern)
- **Legal Gazette Application Web**: App Router
- **Legal Gazette Public Web**: App Router

## App Router Best Practices

### Directory Structure

Following Next.js 13+ recommendations:

```
src/
├── app/                          # Routes (Server Components by default)
│   ├── layout.tsx               # Root layout (required)
│   ├── page.tsx                 # Home page
│   ├── loading.tsx              # Loading UI
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   ├── api/                     # API routes
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── (protected)/             # Route group with auth (no URL segment)
│   │   ├── layout.tsx           # Shared layout for protected routes
│   │   ├── page.tsx             # /protected route
│   │   └── ritstjorn/
│   │       ├── page.tsx         # /ritstjorn route
│   │       └── [id]/
│   │           ├── page.tsx     # /ritstjorn/[id] route
│   │           ├── loading.tsx  # Loading state
│   │           ├── error.tsx    # Error boundary
│   │           └── not-found.tsx # Custom 404
│   └── (public)/                # Route group for public pages
│       └── sidur/
│           └── [slug]/
│               └── page.tsx
│
├── components/                   # React components
│   ├── client-components/       # Components with 'use client'
│   │   ├── providers/           # Context providers
│   │   ├── forms/               # Interactive forms
│   │   ├── buttons/             # Interactive buttons
│   │   └── modals/              # Modal dialogs
│   │
│   └── server-components/       # Server-only components
│       ├── layouts/             # Layout components
│       └── data-displays/       # Static data displays
│
├── containers/                   # Page-level logic containers (client)
│   └── advert/
│       ├── AdvertContainer.tsx  # Main container
│       └── AdvertFormContainer.tsx
│
├── lib/                         # Utilities and configurations
│   ├── trpc/
│   │   ├── client/              # Client-side tRPC (use client)
│   │   │   ├── trpc.ts          # React Query hooks
│   │   │   └── Provider.tsx     # tRPC provider
│   │   └── server/              # Server-side tRPC
│   │       └── trpc.ts          # Server tRPC client
│   ├── auth/
│   │   └── authOptions.ts       # NextAuth configuration
│   └── utils/
│
├── hooks/                       # Custom React hooks (client only)
│   ├── useFilters.ts
│   └── useAuth.ts
│
├── context/                     # React context (client only)
│   └── FilterContext.tsx
│
├── middleware.ts                # Next.js middleware (Edge Runtime)
│
└── styles/                      # Global styles and themes
    └── global.css
```

### Route Groups

Use parentheses `()` to organize routes without affecting the URL:

```
app/
├── (marketing)/          # No /marketing in URL
│   ├── about/
│   └── contact/
├── (shop)/              # No /shop in URL
│   ├── products/
│   └── cart/
└── (protected)/         # No /protected in URL
    ├── dashboard/
    └── settings/
```

**Benefits**:
- Shared layouts per group
- Better code organization
- No URL pollution

### Layouts

Layouts are shared UI that wrap pages and preserve state on navigation:

```typescript
// app/layout.tsx - Root Layout (required)
import { getServerSession } from 'next-auth'
import { Providers } from '@/components/providers/Providers'
import { authOptions } from '@/lib/auth/authOptions'
import './styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="is">
      <body>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

```typescript
// app/(protected)/layout.tsx - Protected Layout
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { authOptions } from '@/lib/auth/authOptions'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/innskraning')
  }
  
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}
```

### Parallel Routes

Use `@folder` syntax for parallel routes (advanced):

```
app/
├── layout.tsx
├── page.tsx
├── @sidebar/
│   └── page.tsx
└── @main/
    └── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  sidebar,
  main,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  main: React.ReactNode
}) {
  return (
    <div>
      <aside>{sidebar}</aside>
      <main>{main}</main>
      {children}
    </div>
  )
}
```

**Used in**: `legal-gazette-public-web/src/app/(protected)/auglysingar/`

## Server Components vs Client Components

### Decision Tree

```
Need interactivity? (onClick, onChange, etc.)
├─ Yes → Client Component ('use client')
└─ No
    └─ Need React hooks? (useState, useEffect, etc.)
        ├─ Yes → Client Component ('use client')
        └─ No
            └─ Need browser APIs? (window, localStorage, etc.)
                ├─ Yes → Client Component ('use client')
                └─ No
                    └─ Need Context Provider?
                        ├─ Yes → Client Component ('use client')
                        └─ No → Server Component (default)
```

### Server Components (Default)

**Characteristics**:
- Run only on the server
- Can be `async` functions
- Can access backend resources directly
- Cannot use React hooks
- Cannot use browser APIs
- Reduce client-side JavaScript bundle

**When to Use**:
- Data fetching from databases/APIs
- Accessing backend resources
- Keeping sensitive information on server (API keys, tokens)
- Reducing client-side JavaScript
- Static or semi-static content

**Example**:

```typescript
// app/(protected)/ritstjorn/[id]/page.tsx
import { fetchQueryWithHandler, HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { AdvertContainer } from '@/containers/advert/AdvertContainer'
import { trpc } from '@/lib/trpc/client/server'

type Props = {
  params: {
    id: string
  }
}

// Server Component - can be async
export default async function AdvertDetails({ params }: Props) {
  const { id } = params
  
  // Prefetch data on server
  prefetch(trpc.getAllEntities.queryOptions())
  await fetchQueryWithHandler(trpc.getAdvert.queryOptions({ id }))
  
  return (
    <HydrateClient>
      <AdvertContainer id={id} />
    </HydrateClient>
  )
}
```

### Client Components

**Characteristics**:
- Run on both server (initial render) and client
- Can use React hooks
- Can use browser APIs
- Can handle user interactions
- Add to client-side JavaScript bundle

**When to Use**:
- Interactive elements (buttons, forms, inputs)
- Event listeners (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext)
- Browser-only APIs (window, localStorage, etc.)
- Custom hooks
- Context providers

**Example**:

```typescript
// containers/advert/AdvertFormContainer.tsx
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Stack } from '@dmr.is/ui/components/island-is'
import { AdvertBaseFields } from '@/components/field-set-items/AdvertBaseFields'

type Props = {
  id: string
}

export function AdvertFormContainer({ id }: Props) {
  // React hooks ✅
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))
  const [isEditing, setIsEditing] = useState(false)
  
  // Event handlers ✅
  const handleSave = () => {
    // ...
  }
  
  return (
    <Stack space={3}>
      <AdvertBaseFields advert={advert} onSave={handleSave} />
    </Stack>
  )
}
```

### Composition Pattern

**Best Practice**: Compose server and client components together:

```typescript
// app/page.tsx - Server Component
import { ClientProvider } from '@/components/providers/ClientProvider'
import { ServerData } from '@/components/ServerData'

export default async function Page() {
  // Fetch data on server
  const data = await fetchData()
  
  return (
    <ClientProvider>
      {/* Server Component */}
      <ServerData data={data} />
      
      {/* Client Component for interactivity */}
      <InteractiveForm initialData={data} />
    </ClientProvider>
  )
}
```

### Passing Data Between Server and Client

**Rules**:
1. Props must be serializable (JSON-compatible)
2. Cannot pass functions, class instances, or Dates
3. Can pass plain objects, arrays, strings, numbers, booleans

```typescript
// ✅ Correct
<ClientComponent data={{ name: 'John', age: 30 }} />

// ❌ Wrong
<ClientComponent 
  onSave={handleSave}           // Functions not serializable
  createdAt={new Date()}        // Dates not serializable
  user={new User()}             // Class instances not serializable
/>

// ✅ Correct workaround
<ClientComponent 
  createdAt={new Date().toISOString()}  // Convert to string
  user={user.toJSON()}                   // Serialize to plain object
/>
```

### Context Providers

Context providers **must** be client components:

```typescript
// components/providers/RootProviders.tsx
'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { NuqsAdapter } from 'nuqs/adapters/next'
import { TRPCReactProvider } from '@/lib/trpc/client/Provider'

export const RootProviders = ({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) => {
  return (
    <TRPCReactProvider>
      <NuqsAdapter>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </NuqsAdapter>
    </TRPCReactProvider>
  )
}
```

Then use in server component:

```typescript
// app/layout.tsx
import { getServerSession } from 'next-auth'
import { RootProviders } from '@/components/providers/RootProviders'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  return (
    <html>
      <body>
        <RootProviders session={session}>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
```

## Data Fetching Patterns

### Server-Side Fetching (Recommended)

Use async/await directly in Server Components:

```typescript
// app/ritstjorn/page.tsx
import { trpc } from '@/lib/trpc/client/server'
import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

export default async function Page() {
  // Fetch data on server
  prefetch(trpc.getAllAdverts.queryOptions())
  
  return (
    <HydrateClient>
      <AdvertsList />
    </HydrateClient>
  )
}
```

### Client-Side Fetching

Use tRPC or React Query in Client Components:

```typescript
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { trpc } from '@/lib/trpc/client/trpc'

export function AdvertsList() {
  const { data: adverts } = useSuspenseQuery(
    trpc.getAllAdverts.queryOptions()
  )
  
  return (
    <ul>
      {adverts.map(advert => (
        <li key={advert.id}>{advert.title}</li>
      ))}
    </ul>
  )
}
```

### Parallel Data Fetching

Fetch multiple resources in parallel:

```typescript
export default async function Page() {
  // Parallel fetching
  const [adverts, categories, users] = await Promise.all([
    fetchAdverts(),
    fetchCategories(),
    fetchUsers(),
  ])
  
  return <Dashboard adverts={adverts} categories={categories} users={users} />
}
```

### Sequential Data Fetching

Fetch data that depends on previous results:

```typescript
export default async function Page({ params }: { params: { id: string } }) {
  // First fetch
  const advert = await fetchAdvert(params.id)
  
  // Depends on first fetch
  const relatedAdverts = await fetchRelatedAdverts(advert.categoryId)
  
  return <AdvertDetail advert={advert} related={relatedAdverts} />
}
```

### Streaming with Suspense

Show loading states while data loads:

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Adverts</h1>
      
      <Suspense fallback={<SkeletonLoader />}>
        <AdvertsList />
      </Suspense>
      
      <Suspense fallback={<p>Loading related...</p>}>
        <RelatedAdverts />
      </Suspense>
    </div>
  )
}
```

## Routing Patterns

### Dynamic Routes

```typescript
// app/ritstjorn/[id]/page.tsx
type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = params
  const tab = searchParams.tab
  
  return <Advert id={id} tab={tab} />
}
```

### Catch-All Routes

```typescript
// app/docs/[...slug]/page.tsx
export default function Page({ params }: { params: { slug: string[] } }) {
  // /docs/a/b/c → slug = ['a', 'b', 'c']
  return <DocsPage slug={params.slug} />
}
```

### Optional Catch-All Routes

```typescript
// app/docs/[[...slug]]/page.tsx
export default function Page({ params }: { params: { slug?: string[] } }) {
  // /docs → slug = undefined
  // /docs/a → slug = ['a']
  return <DocsPage slug={params.slug} />
}
```

### Programmatic Navigation

```typescript
'use client'

import { useRouter } from 'next/navigation'

export function NavigateButton() {
  const router = useRouter()
  
  const handleClick = () => {
    router.push('/ritstjorn/123')
    // router.replace('/ritstjorn/123') - no history entry
    // router.back() - go back
    // router.refresh() - refresh server data
  }
  
  return <button onClick={handleClick}>Navigate</button>
}
```

### Link Component

```typescript
import Link from 'next/link'

export function Navigation() {
  return (
    <nav>
      <Link href="/ritstjorn">Ritstjórn</Link>
      <Link href="/utgafa">Útgáfa</Link>
      <Link 
        href={{
          pathname: '/ritstjorn/[id]',
          query: { id: '123', tab: 'details' },
        }}
      >
        Advert Details
      </Link>
    </nav>
  )
}
```

## Common Patterns in DMR.is

### Protected Routes Pattern

```typescript
// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/innskraning')
  }
  
  return <>{children}</>
}
```

### Container Pattern

Separate data fetching (server) from UI logic (client):

```typescript
// app/ritstjorn/[id]/page.tsx - Server Component
import { AdvertContainer } from '@/containers/advert/AdvertContainer'

export default async function Page({ params }: { params: { id: string } }) {
  // Prefetch on server
  await prefetch(trpc.getAdvert.queryOptions({ id: params.id }))
  
  return (
    <HydrateClient>
      <AdvertContainer id={params.id} />
    </HydrateClient>
  )
}

// containers/advert/AdvertContainer.tsx - Client Component
'use client'

export function AdvertContainer({ id }: { id: string }) {
  const { data } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))
  
  return <AdvertForm advert={data} />
}
```

### Form Handling Pattern

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
})

export function AdvertForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  
  const onSubmit = async (data: z.infer<typeof schema>) => {
    await saveAdvert(data)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea {...register('content')} />
      {errors.content && <span>{errors.content.message}</span>}
      
      <button type="submit">Save</button>
    </form>
  )
}
```

### Modal Pattern

```typescript
'use client'

import { useState } from 'react'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

export function AdvertWithModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent onSave={handleSave} />
      </Modal>
    </>
  )
}
```

### Loading States Pattern

```typescript
// app/ritstjorn/loading.tsx
import { SkeletonLoader } from '@dmr.is/ui/components/SkeletonLoader'

export default function Loading() {
  return (
    <div>
      <SkeletonLoader repeat={5} height={100} />
    </div>
  )
}
```

### Error Boundaries Pattern

```typescript
// app/ritstjorn/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@dmr.is/ui/components/island-is'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Metadata Pattern

```typescript
// app/ritstjorn/[id]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const advert = await fetchAdvert(params.id)
  
  return {
    title: advert.title,
    description: advert.description,
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <AdvertDetail id={params.id} />
}
```

## Migration from Pages Router

### Before (Pages Router)

```typescript
// pages/ritstjorn/[id].tsx
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const advert = await fetchAdvert(params.id)
  
  return {
    props: { advert }
  }
}

export default function Page({ advert }) {
  return <AdvertDetail advert={advert} />
}
```

### After (App Router)

```typescript
// app/ritstjorn/[id]/page.tsx
export default async function Page({ params }: { params: { id: string } }) {
  const advert = await fetchAdvert(params.id)
  
  return <AdvertDetail advert={advert} />
}
```

## Best Practices Summary

1. **Default to Server Components** - only use `'use client'` when needed
2. **Prefetch Data on Server** - reduce client-side waterfall requests
3. **Use Layouts for Shared UI** - avoid repetition across pages
4. **Use Route Groups** - organize without affecting URLs
5. **Keep Client Bundles Small** - minimize `'use client'` components
6. **Use Suspense for Loading States** - better UX with streaming
7. **Use Error Boundaries** - graceful error handling
8. **Serialize Props Carefully** - only pass JSON-compatible data
9. **Use Containers Pattern** - separate server/client concerns
10. **Leverage TypeScript** - strict typing for params and props

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/react/use-server)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

**Note**: This guide reflects patterns used in the Legal Gazette applications. Official Journal Web uses Pages Router and should follow traditional Next.js patterns until migration is planned.
