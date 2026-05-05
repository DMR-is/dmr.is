import { Suspense } from 'react'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@dmr.is/trpc/client/server'

import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { CompaniesPage } from '../../../components/companies/CompaniesPage'
import { trpc } from '../../../lib/trpc/client/server'

export default async function FyrirtaekiPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(trpc.company.list.queryOptions({ pageSize: 1000 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SkeletonLoader repeat={5} height={44} space={1} />}>
        <CompaniesPage />
      </Suspense>
    </HydrationBoundary>
  )
}
