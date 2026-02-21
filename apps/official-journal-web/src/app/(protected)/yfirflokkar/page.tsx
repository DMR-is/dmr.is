import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { CategoryProvider } from '../../../context/categoryContext'
import { trpc } from '../../../lib/trpc/client/server'
import { CategoriesPageContent } from './_components/CategoriesPageContent'

export default async function CategoriesPage() {
  prefetch(trpc.getMainCategories.queryOptions({ pageSize: 1000 }))
  prefetch(trpc.getCategories.queryOptions({ pageSize: 1000 }))
  prefetch(trpc.getDepartments.queryOptions({ pageSize: 10 }))

  return (
    <HydrateClient>
      <CategoryProvider>
        <CategoriesPageContent />
      </CategoryProvider>
    </HydrateClient>
  )
}
