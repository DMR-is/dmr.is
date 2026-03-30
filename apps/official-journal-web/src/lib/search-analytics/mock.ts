import {
  SearchAnalyticsQueryTableType,
  type SearchAnalyticsBreakdownsResponse,
  type SearchAnalyticsOverviewResponse,
  type SearchAnalyticsQueriesResponse,
  type SearchAnalyticsTrendsResponse,
} from './types'

const DEFAULT_DAYS = 30

const parseDate = (value?: string) => {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

const getDateRange = (from?: string, to?: string) => {
  const toDate = parseDate(to) ?? new Date()
  const fromDate = parseDate(from)

  if (fromDate) {
    return { fromDate, toDate }
  }

  const fallbackFrom = new Date(toDate)
  fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - (DEFAULT_DAYS - 1))

  return {
    fromDate: fallbackFrom,
    toDate,
  }
}

const buildTrendPoints = (from?: string, to?: string) => {
  const { fromDate, toDate } = getDateRange(from, to)
  const points: SearchAnalyticsTrendsResponse['points'] = []
  const cursor = new Date(fromDate)
  let index = 0

  while (cursor <= toDate) {
    const weeklyFactor = 1 + ((index % 7) / 10)
    const trendLift = index * 1.6
    const totalSearches = Math.round(42 * weeklyFactor + trendLift)
    const zeroResultRate = Number((12 + (index % 5) * 1.4).toFixed(1))
    const avgDurationMs = Math.round(85 + (index % 6) * 7 + index * 0.9)
    const p95DurationMs = Math.round(avgDurationMs * 1.9)

    points.push({
      date: formatDate(cursor),
      totalSearches,
      zeroResultRate,
      avgDurationMs,
      p95DurationMs,
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
    index += 1
  }

  return points
}

export const shouldUseMockSearchAnalytics = () => {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.OFFICIAL_JOURNAL_SEARCH_ANALYTICS_MOCKS !== 'false'
  )
}

export const getMockSearchAnalyticsOverview =
  (): SearchAnalyticsOverviewResponse => ({
    totalSearches: 1842,
    zeroResultRate: 14.8,
    withFiltersRate: 61.4,
    avgDurationMs: 112,
    p95DurationMs: 284,
    pageOneRate: 86.2,
  })

export const getMockSearchAnalyticsTrends = (input?: {
  from?: string
  to?: string
}): SearchAnalyticsTrendsResponse => ({
  points: buildTrendPoints(input?.from, input?.to),
})

export const getMockSearchAnalyticsBreakdowns =
  (): SearchAnalyticsBreakdownsResponse => ({
    queryKinds: [
      { key: 'free_text', count: 1140, percentage: 61.9 },
      { key: 'publication_number', count: 332, percentage: 18.0 },
      { key: 'internal_case_number', count: 211, percentage: 11.5 },
      { key: 'prefix_wildcard', count: 105, percentage: 5.7 },
      { key: 'empty', count: 54, percentage: 2.9 },
    ],
    resultBuckets: [
      { key: '0', count: 272, percentage: 14.8 },
      { key: '1', count: 184, percentage: 10.0 },
      { key: '2-10', count: 709, percentage: 38.5 },
      { key: '11-50', count: 428, percentage: 23.2 },
      { key: '51-199', count: 177, percentage: 9.6 },
      { key: '200+', count: 72, percentage: 3.9 },
    ],
    sortUsage: [
      { key: 'default', count: 1280, percentage: 69.5 },
      { key: 'publicationDate:DESC', count: 451, percentage: 24.5 },
      { key: 'publicationDate:ASC', count: 111, percentage: 6.0 },
    ],
    filterUsage: [
      { key: 'department', count: 522, percentage: 28.3 },
      { key: 'type', count: 391, percentage: 21.2 },
      { key: 'year', count: 277, percentage: 15.0 },
      { key: 'category', count: 208, percentage: 11.3 },
      { key: 'dateFrom', count: 178, percentage: 9.7 },
      { key: 'dateTo', count: 143, percentage: 7.8 },
      { key: 'mainType', count: 81, percentage: 4.4 },
      { key: 'involvedParty', count: 42, percentage: 2.3 },
    ],
  })

export const getMockSearchAnalyticsQueries = (type: SearchAnalyticsQueryTableType): SearchAnalyticsQueriesResponse => {
  const rows =
    type === SearchAnalyticsQueryTableType.Top
      ? [
          {
            normalizedQuery: 'gjaldskrá',
            count: 84,
            zeroResultRate: 6.0,
            avgDurationMs: 88,
            resultBucket: '11-50',
          },
          {
            normalizedQuery: 'skipulagsmál',
            count: 61,
            zeroResultRate: 11.5,
            avgDurationMs: 93,
            resultBucket: '2-10',
          },
          {
            normalizedQuery: '123/2025',
            count: 58,
            zeroResultRate: 0,
            avgDurationMs: 64,
            resultBucket: '1',
          },
          {
            normalizedQuery: 'lausafjárkaup',
            count: 47,
            zeroResultRate: 4.3,
            avgDurationMs: 102,
            resultBucket: '11-50',
          },
          {
            normalizedQuery: 'útboð',
            count: 40,
            zeroResultRate: 17.5,
            avgDurationMs: 118,
            resultBucket: '2-10',
          },
        ]
      : type === SearchAnalyticsQueryTableType.ZeroResults
        ? [
            {
              normalizedQuery: 'byggingarleyfi akranes',
              count: 19,
              zeroResultRate: 100,
              avgDurationMs: 96,
              resultBucket: '0',
            },
            {
              normalizedQuery: 'reglugerð um loftgæði 2026',
              count: 17,
              zeroResultRate: 88.2,
              avgDurationMs: 104,
              resultBucket: '0',
            },
            {
              normalizedQuery: 'samkeppnisútboð vestfirðir',
              count: 12,
              zeroResultRate: 75,
              avgDurationMs: 126,
              resultBucket: '0',
            },
            {
              normalizedQuery: 'frávísun kæru skipulagsnefnd',
              count: 9,
              zeroResultRate: 66.7,
              avgDurationMs: 110,
              resultBucket: '0',
            },
          ]
        : [
            {
              normalizedQuery: 'deiliskipulag',
              count: 28,
              zeroResultRate: 14.3,
              avgDurationMs: 242,
              resultBucket: '11-50',
            },
            {
              normalizedQuery: 'aðalskipulag',
              count: 23,
              zeroResultRate: 17.4,
              avgDurationMs: 231,
              resultBucket: '11-50',
            },
            {
              normalizedQuery: 'eignarnám',
              count: 16,
              zeroResultRate: 12.5,
              avgDurationMs: 219,
              resultBucket: '2-10',
            },
            {
              normalizedQuery: 'húsnæðisáætlun',
              count: 13,
              zeroResultRate: 7.7,
              avgDurationMs: 214,
              resultBucket: '2-10',
            },
          ]

  return { type, rows }
}
