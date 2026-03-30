import {
  SearchAnalyticsInterval,
  SearchAnalyticsQueryTableType,
} from '@dmr.is/shared-dto'

import {
  buildSearchAnalyticsBreakdowns,
  buildSearchAnalyticsOverview,
  buildSearchAnalyticsQueries,
  buildSearchAnalyticsTrends,
  resolveSearchAnalyticsRange,
} from './search-analytics.utils'

const makeEvent = (
  overrides: Partial<{
    normalizedQuery: string | null
    queryKind: string
    hasFilters: boolean
    filters: Record<string, unknown>
    page: number
    sortBy: string | null
    direction: string | null
    totalResultCount: number
    durationMs: number
    createdAt: Date
  }> = {},
) => ({
  normalizedQuery: 'test query',
  queryKind: 'free_text',
  hasFilters: false,
  filters: {},
  page: 1,
  sortBy: null,
  direction: null,
  totalResultCount: 12,
  durationMs: 100,
  createdAt: new Date('2026-03-28T10:00:00.000Z'),
  ...overrides,
})

describe('search analytics utils', () => {
  describe('resolveSearchAnalyticsRange', () => {
    it('returns explicit inclusive date boundaries', () => {
      const result = resolveSearchAnalyticsRange({
        from: '2026-03-01',
        to: '2026-03-03',
      })

      expect(result.from).toBe('2026-03-01')
      expect(result.to).toBe('2026-03-03')
      expect(result.fromDate.toISOString()).toBe('2026-03-01T00:00:00.000Z')
      expect(result.toDate.toISOString()).toBe('2026-03-03T23:59:59.999Z')
      expect(result.dateKeys).toEqual([
        '2026-03-01',
        '2026-03-02',
        '2026-03-03',
      ])
    })
  })

  describe('buildSearchAnalyticsOverview', () => {
    it('aggregates core KPI metrics', () => {
      const result = buildSearchAnalyticsOverview([
        makeEvent({ totalResultCount: 0, hasFilters: true, page: 1, durationMs: 50 }),
        makeEvent({ totalResultCount: 4, hasFilters: false, page: 2, durationMs: 100 }),
        makeEvent({ totalResultCount: 250, hasFilters: true, page: 1, durationMs: 300 }),
      ])

      expect(result).toEqual({
        totalSearches: 3,
        zeroResultRate: 33.3,
        withFiltersRate: 66.7,
        avgDurationMs: 150,
        p95DurationMs: 300,
        pageOneRate: 66.7,
      })
    })
  })

  describe('buildSearchAnalyticsTrends', () => {
    it('fills empty days and aggregates per-day metrics', () => {
      const result = buildSearchAnalyticsTrends(
        [
          makeEvent({
            totalResultCount: 0,
            durationMs: 60,
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
          }),
          makeEvent({
            totalResultCount: 4,
            durationMs: 120,
            createdAt: new Date('2026-03-01T15:00:00.000Z'),
          }),
        ],
        ['2026-03-01', '2026-03-02'],
        SearchAnalyticsInterval.Day,
      )

      expect(result.points).toEqual([
        {
          date: '2026-03-01',
          totalSearches: 2,
          zeroResultRate: 50,
          avgDurationMs: 90,
          p95DurationMs: 120,
        },
        {
          date: '2026-03-02',
          totalSearches: 0,
          zeroResultRate: 0,
          avgDurationMs: 0,
          p95DurationMs: 0,
        },
      ])
    })
  })

  describe('buildSearchAnalyticsBreakdowns', () => {
    it('builds query, result, sort and filter distributions', () => {
      const result = buildSearchAnalyticsBreakdowns([
        makeEvent({
          filters: { department: ['a'], year: '2026' },
          hasFilters: true,
          sortBy: 'publicationDate',
          direction: 'DESC',
          totalResultCount: 0,
        }),
        makeEvent({
          filters: { department: ['a'] },
          hasFilters: true,
          sortBy: null,
          direction: null,
          totalResultCount: 1,
          queryKind: 'prefix_wildcard',
        }),
      ])

      expect(result.queryKinds).toEqual([
        { key: 'free_text', count: 1, percentage: 50 },
        { key: 'prefix_wildcard', count: 1, percentage: 50 },
      ])
      expect(result.resultBuckets).toEqual([
        { key: '0', count: 1, percentage: 50 },
        { key: '1', count: 1, percentage: 50 },
      ])
      expect(result.sortUsage).toEqual([
        { key: 'default', count: 1, percentage: 50 },
        { key: 'publicationDate:DESC', count: 1, percentage: 50 },
      ])
      expect(result.filterUsage).toEqual([
        { key: 'department', count: 2, percentage: 100 },
        { key: 'year', count: 1, percentage: 50 },
      ])
    })
  })

  describe('buildSearchAnalyticsQueries', () => {
    it('suppresses low-frequency queries and groups repeated rows', () => {
      const repeated = Array.from({ length: 5 }, (_, index) =>
        makeEvent({
          normalizedQuery: 'repeat',
          totalResultCount: index === 0 ? 0 : 3,
          durationMs: 100 + index,
        }),
      )
      const ignored = Array.from({ length: 4 }, () =>
        makeEvent({
          normalizedQuery: 'ignored',
          totalResultCount: 0,
        }),
      )

      const top = buildSearchAnalyticsQueries([...repeated, ...ignored], {
        type: SearchAnalyticsQueryTableType.Top,
      })
      const zeroResults = buildSearchAnalyticsQueries([...repeated, ...ignored], {
        type: SearchAnalyticsQueryTableType.ZeroResults,
      })

      expect(top.rows).toEqual([
        {
          normalizedQuery: 'repeat',
          count: 5,
          zeroResultRate: 20,
          avgDurationMs: 102,
          resultBucket: '2-10',
        },
      ])
      expect(zeroResults.rows[0]?.normalizedQuery).toBe('repeat')
      expect(zeroResults.rows).toHaveLength(1)
    })
  })
})
