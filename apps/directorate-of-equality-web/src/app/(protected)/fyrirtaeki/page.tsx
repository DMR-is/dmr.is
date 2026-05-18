import { Suspense } from 'react'

import { getQueryClient } from '@dmr.is/trpc/client/server'
import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SearchDashboardLoading } from '@dmr.is/ui/components/SearchDashboard/SearchDashboardLoading'

import { CompaniesContainer } from '../../../containers/companies/CompaniesContainer'
import { trpc } from '../../../lib/trpc/client/server'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function FyrirtaekiPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  return (
    <Box height="full">
      <Hero
        title="Fyrirtæki"
        description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
        image={{ src: '/assets/banner-image.svg', alt: 'Fyrirtæki' }}
        breadcrumbs={{
          items: [{ title: 'Forsíða', href: '/' }, { title: 'Fyrirtæki' }],
        }}
        variant="default"
        reverse
        imageSpan={'3/12'}
        withOffset={false}
      />
      <Box background="blue100" paddingY={5} height="full">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<SearchDashboardLoading />}>
            <CompaniesContainer />
          </Suspense>
        </HydrationBoundary>
      </Box>
    </Box>
  )
}
