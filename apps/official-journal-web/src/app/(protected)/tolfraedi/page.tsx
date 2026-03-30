import { fetchQuery, HydrateClient } from '@dmr.is/trpc/client/server'

import { resolveSearchDashboardFilters } from '../../../containers/search-dashboard.utils'
import {
  SearchAnalyticsInterval,
  SearchAnalyticsQueryTableType,
} from '../../../gen/fetch'
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
          interval: SearchAnalyticsInterval.Day,
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
          type: SearchAnalyticsQueryTableType.Top,
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsQueries.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          type: SearchAnalyticsQueryTableType.ZeroResults,
        }),
      ),
      fetchQuery(
        trpc.getSearchAnalyticsQueries.queryOptions({
          from: resolvedFilters.from,
          to: resolvedFilters.to,
          type: SearchAnalyticsQueryTableType.Slow,
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
