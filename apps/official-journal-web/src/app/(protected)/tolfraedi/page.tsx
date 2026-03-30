import { fetchQuery, HydrateClient } from '@dmr.is/trpc/client/server'

import { resolveSearchDashboardFilters } from '../../../containers/search-dashboard.utils'
import { StatisticsPageContainer } from '../../../containers/StatisticsPageContainer'
import { trpc } from '../../../lib/trpc/client/server'

type StatisticsPageSearchParams = {
  from?: string
  to?: string
  preset?: string
  tab?: string
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<StatisticsPageSearchParams>
}) {
  const params = await searchParams
  const resolvedFilters = resolveSearchDashboardFilters(params)
  const initialTab = params.tab === 'leit' ? 'leit' : 'statistics'

  if (initialTab === 'leit') {
    await Promise.allSettled([
      fetchQuery(
        trpc.getSearchAnalyticsOverview.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsTrends.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          interval: 'day',
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsBreakdowns.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsQueries.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          type: 'top',
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsQueries.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          type: 'zero_results',
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsQueries.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          type: 'slow',
        }),
      ),
    ])
  }

  return (
    <HydrateClient>
      <StatisticsPageContainer
        initialFilters={resolvedFilters}
        initialTab={initialTab}
      />
    </HydrateClient>
  )
}
