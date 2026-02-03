# Page Patterns Reference

Complete implementations for all Next.js + tRPC page patterns.

## Pattern Selection Matrix

| Page Type | Mutations | Pattern |
|-----------|-----------|---------|
| List | No | [Simple List](#simple-list-pattern) |
| List | Yes (delete, bulk actions) | [Interactive List](#interactive-list-pattern) |
| Detail | No | [Simple Detail](#simple-detail-pattern) |
| Detail | Yes (edit, delete) | [Interactive Detail](#interactive-detail-pattern) |
| Form | Yes (create/edit) | [Form](#form-pattern) |
| Dashboard | Mixed | [Multi-Section](#multi-section-pattern) |

---

## Simple List Pattern

**Use when:** Displaying data with no mutations (read-only list)

### page.tsx (Server Component)

```tsx
import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { FeatureListContainer } from '../../containers/feature/FeatureListContainer'
import { trpc } from '../../lib/trpc/client/server'

export default async function FeatureListPage() {
  prefetch(trpc.getAllFeatures.queryOptions())

  return (
    <HydrateClient>
      <FeatureListContainer />
    </HydrateClient>
  )
}
```

### loading.tsx

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

### FeatureListContainer.tsx (Client Component)

```tsx
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { GridContainer, Stack, Text } from '@dmr.is/ui/components/island-is'

import { FeatureCard } from '../components/feature/FeatureCard'
import { useTRPC } from '../lib/trpc/client/trpc'

export function FeatureListContainer() {
  const trpc = useTRPC()
  const { data: items } = useSuspenseQuery(trpc.getAllFeatures.queryOptions())

  if (items.length === 0) {
    return (
      <GridContainer>
        <Text>No items found.</Text>
      </GridContainer>
    )
  }

  return (
    <GridContainer>
      <Stack space={3}>
        {items.map((item) => (
          <FeatureCard key={item.id} item={item} />
        ))}
      </Stack>
    </GridContainer>
  )
}
```

### FeatureCard.tsx (Client Component)

```tsx
'use client'

import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'

import type { FeatureItem } from '@/types/feature'

type Props = {
  item: FeatureItem
}

export function FeatureCard({ item }: Props) {
  return (
    <Box padding={3} border="standard" borderRadius="large">
      <Stack space={2}>
        <Text variant="h4">{item.title}</Text>
        <Text>{item.description}</Text>
      </Stack>
    </Box>
  )
}
```

---

## Interactive List Pattern

**Use when:** List with delete, selection, or other mutations

### FeatureListContainer.tsx with Mutations

```tsx
'use client'

import { useCallback } from 'react'
import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { GridContainer, Stack, toast } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../lib/trpc/client/trpc'
import { FeatureCard } from '../components/feature/FeatureCard'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export function FeatureListContainer() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: items } = useSuspenseQuery(trpc.getAllFeatures.queryOptions())

  const deleteMutation = useMutation(
    trpc.deleteFeature.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: trpc.getAllFeatures.queryKey() })
        toast.success('Item deleted')
      },
      onError: (error) => {
        toast.error(`Failed to delete: ${error.message}`)
      },
    }),
  )

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id })
  }, [deleteMutation])

  return (
    <GridContainer>
      <Stack space={3}>
        {items.map((item) => (
          <FeatureCard
            key={item.id}
            item={item}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </Stack>
    </GridContainer>
  )
}
```

### FeatureCard.tsx with Actions

```tsx
'use client'

import { Box, Button, Stack, Text } from '@dmr.is/ui/components/island-is'

import type { FeatureItem } from '@/types/feature'

type Props = {
  item: FeatureItem
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

export function FeatureCard({ item, onDelete, isDeleting }: Props) {
  return (
    <Box padding={3} border="standard" borderRadius="large">
      <Stack space={2}>
        <Text variant="h4">{item.title}</Text>
        <Text>{item.description}</Text>
        {onDelete && (
          <Button
            variant="ghost"
            colorScheme="destructive"
            size="small"
            onClick={() => onDelete(item.id)}
            loading={isDeleting}
          >
            Delete
          </Button>
        )}
      </Stack>
    </Box>
  )
}
```

---

## Simple Detail Pattern

**Use when:** Single item display, no editing

### app/{route}/[id]/page.tsx

```tsx
import { notFound } from 'next/navigation'
import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'

import { FeatureDetailContainer } from '../../../containers/feature/FeatureDetailContainer'
import { trpc } from '../../../lib/trpc/client/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function FeatureDetailPage({ params }: Props) {
  const { id } = await params

  const result = await fetchQueryWithHandler(
    trpc.getFeatureById.queryOptions({ id }),
  )

  if (!result) {
    notFound()
  }

  return (
    <HydrateClient>
      <FeatureDetailContainer id={id} />
    </HydrateClient>
  )
}
```

### FeatureDetailContainer.tsx

```tsx
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { FeatureHeader } from '../components/feature/FeatureHeader'
import { FeatureContent } from '../components/feature/FeatureContent'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  id: string
}

export function FeatureDetailContainer({ id }: Props) {
  const trpc = useTRPC()
  const { data: item } = useSuspenseQuery(
    trpc.getFeatureById.queryOptions({ id })
  )

  return (
    <GridContainer>
      <Stack space={4}>
        <FeatureHeader title={item.title} />
        <FeatureContent data={item} />
      </Stack>
    </GridContainer>
  )
}
```

---

## Interactive Detail Pattern

**Use when:** Detail page with edit or delete capabilities

### FeatureDetailContainer.tsx with Mutations

```tsx
'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Box, Button, GridContainer, Stack, toast } from '@dmr.is/ui/components/island-is'

import { FeatureHeader } from '../components/feature/FeatureHeader'
import { FeatureContent } from '../components/feature/FeatureContent'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  id: string
}

export function FeatureDetailContainer({ id }: Props) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: item } = useSuspenseQuery(
    trpc.getFeatureById.queryOptions({ id })
  )

  const deleteMutation = useMutation(
    trpc.deleteFeature.mutationOptions({
      onSuccess: () => {
        toast.success('Item deleted')
        router.push('/features')
      },
      onError: (error) => {
        toast.error(`Failed to delete: ${error.message}`)
      },
    }),
  )

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure?')) {
      deleteMutation.mutate({ id })
    }
  }, [id, deleteMutation])

  return (
    <GridContainer>
      <Stack space={4}>
        <Box display="flex" justifyContent="spaceBetween" alignItems="center">
          <FeatureHeader title={item.title} />
          <Box display="flex" columnGap={2}>
            <Button onClick={() => router.push(`/features/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              colorScheme="destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Box>
        </Box>
        <FeatureContent data={item} />
      </Stack>
    </GridContainer>
  )
}
```

---

## Form Pattern

**Use when:** Creating or editing data with validation

### page.tsx (Create)

```tsx
import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { FeatureFormContainer } from '../../containers/feature/FeatureFormContainer'
import { trpc } from '../../lib/trpc/client/server'

export default async function CreateFeaturePage() {
  // Prefetch any reference data needed for form (dropdowns, etc.)
  prefetch(trpc.getBaseEntities.queryOptions())

  return (
    <HydrateClient>
      <FeatureFormContainer mode="create" />
    </HydrateClient>
  )
}
```

### page.tsx (Edit)

```tsx
import { notFound } from 'next/navigation'
import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
} from '@dmr.is/trpc/client/server'

import { FeatureFormContainer } from '../../../containers/feature/FeatureFormContainer'
import { trpc } from '../../../lib/trpc/client/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditFeaturePage({ params }: Props) {
  const { id } = await params

  const result = await fetchQueryWithHandler(
    trpc.getFeatureById.queryOptions({ id }),
  )

  if (!result) {
    notFound()
  }

  prefetch(trpc.getBaseEntities.queryOptions())

  return (
    <HydrateClient>
      <FeatureFormContainer mode="edit" id={id} />
    </HydrateClient>
  )
}
```

### FeatureFormContainer.tsx

```tsx
'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  Button,
  GridContainer,
  Stack,
  toast,
} from '@dmr.is/ui/components/island-is'

import { featureSchema, type FeatureFormValues } from '../schemas/feature'
import { FeatureFormFields } from '../components/feature/FeatureFormFields'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props =
  | { mode: 'create'; id?: never }
  | { mode: 'edit'; id: string }

export function FeatureFormContainer({ mode, id }: Props) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Only fetch if editing
  const { data: existingData } = useSuspenseQuery(
    trpc.getFeatureById.queryOptions(
      { id: id! },
      { enabled: mode === 'edit' },
    ),
  )

  const methods = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: mode === 'edit' ? existingData : undefined,
  })

  const createMutation = useMutation(
    trpc.createFeature.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: trpc.getAllFeatures.queryKey() })
        toast.success('Created successfully')
        router.push(`/features/${data.id}`)
      },
      onError: (error) => {
        toast.error(`Failed to create: ${error.message}`)
      },
    }),
  )

  const updateMutation = useMutation(
    trpc.updateFeature.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.getFeatureById.queryKey({ id: id! }) })
        queryClient.invalidateQueries({ queryKey: trpc.getAllFeatures.queryKey() })
        toast.success('Updated successfully')
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`)
      },
    }),
  )

  const handleSubmit = useCallback(
    (values: FeatureFormValues) => {
      if (mode === 'create') {
        createMutation.mutate(values)
      } else {
        updateMutation.mutate({ id, ...values })
      }
    },
    [mode, id, createMutation, updateMutation],
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <GridContainer>
      <FormProvider {...methods}>
        <Box
          component="form"
          onSubmit={methods.handleSubmit(handleSubmit)}
        >
          <Stack space={4}>
            <FeatureFormFields />

            <Box display="flex" justifyContent="flexEnd" columnGap={2}>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </FormProvider>
    </GridContainer>
  )
}
```

### FeatureFormFields.tsx

```tsx
'use client'

import { useFormContext } from 'react-hook-form'
import { Input, Stack } from '@dmr.is/ui/components/island-is'

import type { FeatureFormValues } from '@/schemas/feature'

export function FeatureFormFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FeatureFormValues>()

  return (
    <Stack space={3}>
      <Input
        label="Title"
        {...register('title')}
        errorMessage={errors.title?.message}
        required
      />
      <Input
        label="Description"
        {...register('description')}
        errorMessage={errors.description?.message}
        textarea
        rows={4}
      />
    </Stack>
  )
}
```

### Schema (schemas/feature.ts)

```tsx
import { z } from 'zod'

export const featureSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
})

export type FeatureFormValues = z.infer<typeof featureSchema>
```

---

## Multi-Section Pattern

**Use when:** Dashboard with multiple independent data sections

### page.tsx with Streaming

```tsx
import { Suspense } from 'react'
import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { GridContainer, Stack } from '@dmr.is/ui/components/island-is'

import { StatsContainer } from '../../containers/dashboard/StatsContainer'
import { RecentItemsContainer } from '../../containers/dashboard/RecentItemsContainer'
import { StatsSkeleton } from '../../components/dashboard/StatsSkeleton'
import { RecentItemsSkeleton } from '../../components/dashboard/RecentItemsSkeleton'
import { trpc } from '../../lib/trpc/client/server'

export default async function DashboardPage() {
  // Prefetch both - allows streaming
  prefetch(trpc.getStats.queryOptions())
  prefetch(trpc.getRecentItems.queryOptions())

  return (
    <HydrateClient>
      <GridContainer>
        <Stack space={6}>
          {/* Stats load first (usually faster) */}
          <Suspense fallback={<StatsSkeleton />}>
            <StatsContainer />
          </Suspense>

          {/* Recent items can load after */}
          <Suspense fallback={<RecentItemsSkeleton />}>
            <RecentItemsContainer />
          </Suspense>
        </Stack>
      </GridContainer>
    </HydrateClient>
  )
}
```

### Individual Section Containers

```tsx
'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../lib/trpc/client/trpc'

export function StatsContainer() {
  const trpc = useTRPC()
  const { data: stats } = useSuspenseQuery(
    trpc.getStats.queryOptions()
  )

  return (
    <Box>
      <Stack space={3}>
        <Text variant="h3">Statistics</Text>
        {/* Render stats */}
      </Stack>
    </Box>
  )
}

export function RecentItemsContainer() {
  const trpc = useTRPC()
  const { data: items } = useSuspenseQuery(
    trpc.getRecentItems.queryOptions()
  )

  return (
    <Box>
      <Stack space={3}>
        <Text variant="h3">Recent Items</Text>
        {/* Render items */}
      </Stack>
    </Box>
  )
}
```
