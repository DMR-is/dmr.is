import { Suspense } from 'react'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@dmr.is/trpc/client/server'

import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { CompaniesPage } from '../../../components/companies/CompaniesPage'
import { trpc } from '../../../lib/trpc/client/server'

type SearchParams = {
  q?: string
  minEmployeeCount?: string
  page?: string
  pageSize?: string
  sortBy?: 'name' | 'employeeCount'
  direction?: 'asc' | 'desc'
}

export default async function FyrirtaekiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(
    trpc.company.list.queryOptions({
      q: params.q || undefined,
      minEmployeeCount: params.minEmployeeCount
        ? parseInt(params.minEmployeeCount, 10) || undefined
        : undefined,
      page: params.page ? parseInt(params.page, 10) || 1 : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) || 10 : 10,
      sortBy: params.sortBy,
      direction: params.direction,
    }),
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SkeletonLoader repeat={5} height={44} space={1} />}>
        <CompaniesPage />
      </Suspense>
    </HydrationBoundary>
  )
}
