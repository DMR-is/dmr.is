'use client'

import { Box } from '../../island-is/lib/Box'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import * as styles from './SearchDashboard.css'
import { SearchDashboardBreakdownCard } from './SearchDashboardBreakdownCard'
import { SearchDashboardEmptyState } from './SearchDashboardEmptyState'
import { SearchDashboardFilters } from './SearchDashboardFilters'
import { SearchDashboardKpiGrid } from './SearchDashboardKpiGrid'
import { SearchDashboardLoading } from './SearchDashboardLoading'
import { SearchDashboardQueryTable } from './SearchDashboardQueryTable'
import { SearchDashboardTrendChart } from './SearchDashboardTrendChart'
import type { SearchDashboardProps } from './types'

export const SearchDashboard = ({
  title,
  description,
  loading,
  empty,
  emptyState,
  filters,
  kpis = [],
  trendCharts = [],
  breakdowns = [],
  queryTables = [],
}: SearchDashboardProps) => {
  if (loading) {
    return <SearchDashboardLoading />
  }

  return (
    <Stack space={4}>
      <Stack space={1}>
        <Text variant="h2">{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </Stack>
      <Box className={styles.root}>
        {filters ? <SearchDashboardFilters {...filters} /> : null}
        {empty && emptyState ? (
          <SearchDashboardEmptyState {...emptyState} />
        ) : (
          <>
            {kpis.length > 0 ? <SearchDashboardKpiGrid items={kpis} /> : null}
            {trendCharts.length > 0 ? (
              <Box className={styles.trendGrid}>
                {trendCharts.map((chart) => (
                  <SearchDashboardTrendChart key={chart.title} {...chart} />
                ))}
              </Box>
            ) : null}
            {breakdowns.length > 0 ? (
              <Box className={styles.breakdownGrid}>
                {breakdowns.map((card) => (
                  <SearchDashboardBreakdownCard key={card.title} {...card} />
                ))}
              </Box>
            ) : null}
            {queryTables.length > 0 ? (
              <Box className={styles.tableGrid}>
                {queryTables.map((table) => (
                  <SearchDashboardQueryTable key={table.title} {...table} />
                ))}
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </Stack>
  )
}
