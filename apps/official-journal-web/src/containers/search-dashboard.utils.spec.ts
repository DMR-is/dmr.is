import {
  mapBreakdownsToCards,
  mapOverviewToKpis,
  mapQueriesToTables,
  mapTrendsToCharts,
  resolveSearchDashboardFilters,
} from './search-dashboard.utils'

describe('search-dashboard utils', () => {
  describe('resolveSearchDashboardFilters', () => {
    it('uses explicit query params when valid', () => {
      expect(
        resolveSearchDashboardFilters({
          from: '2026-03-01',
          to: '2026-03-15',
          preset: '7d',
        }),
      ).toEqual({
        from: '2026-03-01',
        to: '2026-03-15',
        preset: '7d',
      })
    })

    it('falls back to the default preset range when params are missing', () => {
      const result = resolveSearchDashboardFilters({})

      expect(result.preset).toBe('30d')
      expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('mapping helpers', () => {
    it('maps overview, trends, breakdowns and tables to UI props', () => {
      const kpis = mapOverviewToKpis({
        totalSearches: 10,
        zeroResultRate: 20,
        withFiltersRate: 60,
        avgDurationMs: 110,
        p95DurationMs: 220,
        pageOneRate: 80,
      })
      const charts = mapTrendsToCharts({
        points: [
          {
            date: '2026-03-01',
            totalSearches: 5,
            zeroResultRate: 20,
            avgDurationMs: 100,
            p95DurationMs: 150,
          },
        ],
      })
      const breakdowns = mapBreakdownsToCards({
        queryKinds: [{ key: 'free_text', count: 6, percentage: 60 }],
        resultBuckets: [{ key: '2-10', count: 4, percentage: 40 }],
        sortUsage: [{ key: 'default', count: 8, percentage: 80 }],
        filterUsage: [{ key: 'department', count: 3, percentage: 30 }],
      })
      const tables = mapQueriesToTables({
        top: {
          type: 'top' as never,
          rows: [
            {
              normalizedQuery: 'repeat',
              count: 5,
              zeroResultRate: 20,
              avgDurationMs: 100,
              resultBucket: '2-10',
            },
          ],
        },
      })

      expect(kpis[0]).toEqual({
        label: 'Leitir alls',
        value: '10',
        helpText: 'Heildarfjöldi leita á valda tímabilinu.',
      })
      expect(charts[0]?.points[0]).toEqual({
        label: '2026-03-01',
        value: 5,
      })
      expect(breakdowns[0]?.items[0]?.label).toBe('Frjáls leit')
      expect(tables[0]?.rows[0]).toEqual({
        normalizedQuery: 'repeat',
        count: '5',
        zeroResultRate: '20.0%',
        avgDurationMs: '100 ms',
        resultBucket: '2-10',
      })
    })
  })
})
