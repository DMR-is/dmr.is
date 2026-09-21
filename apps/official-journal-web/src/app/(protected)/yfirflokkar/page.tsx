import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { CategoryProvider } from '../../../context/categoryContext'
import { trpc } from '../../../lib/trpc/client/server'
import { CategoriesPageContent } from './_components/CategoriesPageContent'

export default async function CategoriesPage() {
  // Awaited: the consumers read these through `useQuery` and render
  // `data ?? []`, so streaming the page out first would server-render empty
  // tables and selects and hydrate populated ones. `retry: false` stops a dead
  // API holding the whole page back.
  await Promise.all([
    prefetch({
      ...trpc.getMainCategories.queryOptions({ pageSize: 1000 }),
      retry: false,
    }),
    prefetch({
      ...trpc.getCategories.queryOptions({ pageSize: 1000 }),
      retry: false,
    }),
    prefetch({
      ...trpc.getDepartments.queryOptions({ pageSize: 10 }),
      retry: false,
    }),
  ])

  return (
    <HydrateClient>
      <CategoryProvider>
        <CategoriesPageContent />
      </CategoryProvider>
    </HydrateClient>
  )
}
