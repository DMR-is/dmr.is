'use client'

import { parseAsString, useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SearchDashboard } from '@dmr.is/ui/components/SearchDashboard'

import { useTRPC } from '../lib/trpc/client/trpc'
import {
  DEFAULT_SEARCH_DASHBOARD_PRESET,
  getPresetRange,
  mapBreakdownsToCards,
  mapOverviewToKpis,
  mapQueriesToTables,
  mapTrendsToCharts,
  SEARCH_DASHBOARD_PRESETS,
} from './search-dashboard.utils'

import { keepPreviousData } from '@tanstack/react-query'

type Props = {
  initialFilters: {
    from: string
    to: string
    preset?: string | null
  }
  embedded?: boolean
  title?: string
  description?: string
}

export const SearchDashboardContainer = ({
  initialFilters,
  embedded = false,
  title = 'Leitaryfirlit',
  description = 'Innri greining á leitarmynstri, niðurstöðum og svörun í Stjórnartíðindum.',
}: Props) => {
  const trpc = useTRPC()
  const [params, setParams] = useQueryStates(
    {
      from: parseAsString.withDefault(initialFilters.from),
      to: parseAsString.withDefault(initialFilters.to),
      preset: parseAsString.withDefault(
        initialFilters.preset ?? DEFAULT_SEARCH_DASHBOARD_PRESET,
      ),
    },
    {
      history: 'replace',
      shallow: true,
    },
  )

  const queryInput = {
    from: params.from,
    to: params.to,
  }

  const queryOptions = {
    placeholderData: keepPreviousData,
  } as const

  const overviewQuery = useQuery(
    trpc.getSearchAnalyticsOverview.queryOptions(queryInput, queryOptions),
  )
  const trendsQuery = useQuery(
    trpc.getSearchAnalyticsTrends.queryOptions(
      {
        ...queryInput,
        interval: 'day',
      },
      queryOptions,
    ),
  )
  const breakdownsQuery = useQuery(
    trpc.getSearchAnalyticsBreakdowns.queryOptions(queryInput, queryOptions),
  )
  const topQueries = useQuery(
    trpc.getSearchAnalyticsQueries.queryOptions(
      {
        ...queryInput,
        type: 'top',
      },
      queryOptions,
    ),
  )
  const zeroResultQueries = useQuery(
    trpc.getSearchAnalyticsQueries.queryOptions(
      {
        ...queryInput,
        type: 'zero_results',
      },
      queryOptions,
    ),
  )
  const slowQueries = useQuery(
    trpc.getSearchAnalyticsQueries.queryOptions(
      {
        ...queryInput,
        type: 'slow',
      },
      queryOptions,
    ),
  )

  const loading =
    (!overviewQuery.data && overviewQuery.isPending) ||
    (!trendsQuery.data && trendsQuery.isPending) ||
    (!breakdownsQuery.data && breakdownsQuery.isPending)

  const dashboard = (
    <SearchDashboard
      title={title}
      description={description}
      loading={loading}
      empty={(overviewQuery.data?.totalSearches ?? 0) === 0}
      emptyState={{
        title: 'Engin leitargögn',
        message: 'Engin leitaratvik fundust á völdu tímabili.',
      }}
      filters={{
        helpText:
          'Veldu tímabil fyrir samantektina. Allar tölur, gröf og töflur miðast við þetta dagabil.',
        values: {
          from: params.from,
          to: params.to,
          preset: params.preset,
        },
        presets: SEARCH_DASHBOARD_PRESETS,
        onFromChange: (from) => setParams({ from, preset: null }),
        onToChange: (to) => setParams({ to, preset: null }),
        onPresetChange: (preset) => {
          const range = getPresetRange(preset)
          setParams({
            from: range.from,
            to: range.to,
            preset,
          })
        },
        onReset: () => {
          const range = getPresetRange(DEFAULT_SEARCH_DASHBOARD_PRESET)
          setParams(range)
        },
      }}
      kpis={mapOverviewToKpis(overviewQuery.data)}
      trendCharts={mapTrendsToCharts(trendsQuery.data)}
      breakdowns={mapBreakdownsToCards(breakdownsQuery.data)}
      queryTables={mapQueriesToTables({
        top: topQueries.data,
        zeroResults: zeroResultQueries.data,
        slow: slowQueries.data,
      })}
    />
  )

  if (embedded) {
    return dashboard
  }

  return (
    <GridContainer>
      <GridRow marginTop={[3, 4]} marginBottom={[5, 6]}>
        <GridColumn span="12/12">{dashboard}</GridColumn>
      </GridRow>
    </GridContainer>
  )
}
