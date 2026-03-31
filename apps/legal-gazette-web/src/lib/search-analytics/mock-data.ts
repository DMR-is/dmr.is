import {
  type SearchAnalyticsBreakdownItem,
  type SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsInterval,
  type SearchAnalyticsOverviewResponse,
  type SearchAnalyticsQueriesQuery,
  type SearchAnalyticsQueriesResponse,
  type SearchAnalyticsQueryRow,
  SearchAnalyticsQueryTableType,
  type SearchAnalyticsRangeQuery,
  type SearchAnalyticsTrendPoint,
  type SearchAnalyticsTrendsQuery,
  type SearchAnalyticsTrendsResponse,
} from './types'

type SearchAnalyticsEvent = {
  normalizedQuery: string | null
  queryKind: string
  filters: Record<string, string | string[]>
  page: number
  sortBy: string | null
  direction: string | null
  totalResultCount: number
  durationMs: number
  createdAt: Date
}

type QueryGroup = {
  normalizedQuery: string
  count: number
  zeroCount: number
  filterCount: number
  pageOneCount: number
  totalDurationMs: number
  totalResultCount: number
  durations: number[]
}

const DEFAULT_LOOKBACK_DAYS = 30
const MIN_QUERY_COUNT = 5
const MAX_QUERY_ROWS = 10
const REYKJAVIK_TIMEZONE = 'Atlantic/Reykjavik'

const round = (value: number, decimals = 1): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Number(value.toFixed(decimals))
}

const toDateKey = (value: Date): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: REYKJAVIK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(value)
}

const parseDateBoundary = (
  value: string | undefined,
  endOfDay = false,
): Date | null => {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    throw new Error(`Invalid date: ${value}`)
  }

  const [_, year, month, day] = match
  const hours = endOfDay ? 23 : 0
  const minutes = endOfDay ? 59 : 0
  const seconds = endOfDay ? 59 : 0
  const milliseconds = endOfDay ? 999 : 0

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      hours,
      minutes,
      seconds,
      milliseconds,
    ),
  )
}

const resolveSearchAnalyticsRange = (query?: SearchAnalyticsRangeQuery) => {
  const today = new Date()
  const todayKey = toDateKey(today)
  const defaultTo = parseDateBoundary(todayKey, true) as Date
  const defaultFrom = new Date(defaultTo)
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - (DEFAULT_LOOKBACK_DAYS - 1))
  defaultFrom.setUTCHours(0, 0, 0, 0)

  const fromDate = parseDateBoundary(query?.from, false) ?? defaultFrom
  const toDate = parseDateBoundary(query?.to, true) ?? defaultTo

  if (fromDate > toDate) {
    throw new Error('from must be before or equal to to')
  }

  const dateKeys: string[] = []
  const cursor = new Date(fromDate)
  cursor.setUTCHours(0, 0, 0, 0)

  while (cursor <= toDate) {
    dateKeys.push(toDateKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return { fromDate, toDate, dateKeys }
}

const calculateP95 = (durations: number[]): number => {
  if (durations.length === 0) {
    return 0
  }

  const sorted = [...durations].sort((a, b) => a - b)
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1)

  return Math.round(sorted[index])
}

const resultBucketForCount = (count: number): string => {
  if (count <= 0) {
    return '0'
  }
  if (count === 1) {
    return '1'
  }
  if (count <= 10) {
    return '2-10'
  }
  if (count <= 50) {
    return '11-50'
  }
  if (count < 200) {
    return '51-199'
  }

  return '200+'
}

const isMeaningfulFilterValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return typeof value === 'string' ? value.length > 0 : false
}

const toBreakdownItems = (
  counts: Map<string, number>,
  total: number,
): SearchAnalyticsBreakdownItem[] => {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({
      key,
      count,
      percentage: total > 0 ? round((count / total) * 100) : 0,
    }))
}

const toQueryRow = (group: QueryGroup): SearchAnalyticsQueryRow => {
  const avgDurationMs = Math.round(group.totalDurationMs / group.count)
  const avgResultCount = Math.round(group.totalResultCount / group.count)

  return {
    normalizedQuery: group.normalizedQuery,
    count: group.count,
    zeroResultRate: round((group.zeroCount / group.count) * 100),
    avgDurationMs,
    resultBucket: resultBucketForCount(avgResultCount),
  }
}

const buildQueryGroups = (events: SearchAnalyticsEvent[]): QueryGroup[] => {
  const groups = new Map<string, QueryGroup>()

  for (const event of events) {
    if (!event.normalizedQuery) {
      continue
    }

    const existing = groups.get(event.normalizedQuery) ?? {
      normalizedQuery: event.normalizedQuery,
      count: 0,
      zeroCount: 0,
      filterCount: 0,
      pageOneCount: 0,
      totalDurationMs: 0,
      totalResultCount: 0,
      durations: [],
    }

    existing.count += 1
    existing.zeroCount += event.totalResultCount === 0 ? 1 : 0
    existing.filterCount += Object.values(event.filters).some(
      isMeaningfulFilterValue,
    )
      ? 1
      : 0
    existing.pageOneCount += event.page <= 1 ? 1 : 0
    existing.totalDurationMs += event.durationMs
    existing.totalResultCount += event.totalResultCount
    existing.durations.push(event.durationMs)

    groups.set(event.normalizedQuery, existing)
  }

  return Array.from(groups.values()).filter(
    (group) => group.count >= MIN_QUERY_COUNT,
  )
}

const filterEventsByRange = (query?: SearchAnalyticsRangeQuery) => {
  const { fromDate, toDate } = resolveSearchAnalyticsRange(query)

  return MOCK_SEARCH_EVENTS.filter((event) => {
    return event.createdAt >= fromDate && event.createdAt <= toDate
  })
}

const buildSearchAnalyticsOverview = (
  events: SearchAnalyticsEvent[],
): SearchAnalyticsOverviewResponse => {
  const total = events.length
  const zeroCount = events.filter(
    (event) => event.totalResultCount === 0,
  ).length
  const withFiltersCount = events.filter((event) =>
    Object.values(event.filters).some(isMeaningfulFilterValue),
  ).length
  const pageOneCount = events.filter((event) => event.page <= 1).length
  const durations = events.map((event) => event.durationMs)
  const avgDurationMs =
    total > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / total)
      : 0

  return {
    totalSearches: total,
    zeroResultRate: total > 0 ? round((zeroCount / total) * 100) : 0,
    withFiltersRate: total > 0 ? round((withFiltersCount / total) * 100) : 0,
    avgDurationMs,
    p95DurationMs: calculateP95(durations),
    pageOneRate: total > 0 ? round((pageOneCount / total) * 100) : 0,
  }
}

const buildSearchAnalyticsTrends = (
  events: SearchAnalyticsEvent[],
  dateKeys: string[],
  interval?: SearchAnalyticsInterval,
): SearchAnalyticsTrendsResponse => {
  if (interval && interval !== SearchAnalyticsInterval.Day) {
    throw new Error(`Unsupported interval: ${interval}`)
  }

  const byDate = new Map<string, SearchAnalyticsEvent[]>()

  for (const event of events) {
    const key = toDateKey(event.createdAt)
    const list = byDate.get(key) ?? []
    list.push(event)
    byDate.set(key, list)
  }

  const points: SearchAnalyticsTrendPoint[] = dateKeys.map((date) => {
    const dayEvents = byDate.get(date) ?? []
    const total = dayEvents.length
    const zeroCount = dayEvents.filter(
      (event) => event.totalResultCount === 0,
    ).length
    const durations = dayEvents.map((event) => event.durationMs)
    const avgDurationMs =
      total > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / total)
        : 0

    return {
      date,
      totalSearches: total,
      zeroResultRate: total > 0 ? round((zeroCount / total) * 100) : 0,
      avgDurationMs,
      p95DurationMs: calculateP95(durations),
    }
  })

  return { points }
}

const buildSearchAnalyticsBreakdowns = (
  events: SearchAnalyticsEvent[],
): SearchAnalyticsBreakdownsResponse => {
  const total = events.length
  const queryKinds = new Map<string, number>()
  const resultBuckets = new Map<string, number>()
  const sortUsage = new Map<string, number>()
  const filterUsage = new Map<string, number>()

  for (const event of events) {
    queryKinds.set(event.queryKind, (queryKinds.get(event.queryKind) ?? 0) + 1)

    const resultBucket = resultBucketForCount(event.totalResultCount)
    resultBuckets.set(resultBucket, (resultBuckets.get(resultBucket) ?? 0) + 1)

    const sortKey = event.sortBy
      ? `${event.sortBy}:${(event.direction ?? 'ASC').toUpperCase()}`
      : 'default'
    sortUsage.set(sortKey, (sortUsage.get(sortKey) ?? 0) + 1)

    for (const [key, value] of Object.entries(event.filters)) {
      if (!isMeaningfulFilterValue(value)) {
        continue
      }

      filterUsage.set(key, (filterUsage.get(key) ?? 0) + 1)
    }
  }

  return {
    queryKinds: toBreakdownItems(queryKinds, total),
    resultBuckets: toBreakdownItems(resultBuckets, total),
    sortUsage: toBreakdownItems(sortUsage, total),
    filterUsage: toBreakdownItems(filterUsage, total),
  }
}

const buildSearchAnalyticsQueries = (
  events: SearchAnalyticsEvent[],
  query: SearchAnalyticsQueriesQuery,
): SearchAnalyticsQueriesResponse => {
  const groups = buildQueryGroups(events)

  const rows = (() => {
    switch (query.type) {
      case SearchAnalyticsQueryTableType.Top:
        return groups
          .sort(
            (a, b) =>
              b.count - a.count ||
              a.normalizedQuery.localeCompare(b.normalizedQuery),
          )
          .slice(0, MAX_QUERY_ROWS)
          .map(toQueryRow)
      case SearchAnalyticsQueryTableType.ZeroResults:
        return groups
          .filter((group) => group.zeroCount > 0)
          .sort(
            (a, b) =>
              b.zeroCount - a.zeroCount ||
              b.count - a.count ||
              a.normalizedQuery.localeCompare(b.normalizedQuery),
          )
          .slice(0, MAX_QUERY_ROWS)
          .map(toQueryRow)
      case SearchAnalyticsQueryTableType.Slow:
        return groups
          .sort((a, b) => {
            const avgA = a.totalDurationMs / a.count
            const avgB = b.totalDurationMs / b.count

            return (
              avgB - avgA ||
              b.count - a.count ||
              a.normalizedQuery.localeCompare(b.normalizedQuery)
            )
          })
          .slice(0, MAX_QUERY_ROWS)
          .map(toQueryRow)
      default:
        return []
    }
  })()

  return {
    type: query.type,
    rows,
  }
}

const makeEvent = ({
  date,
  normalizedQuery,
  queryKind = 'free_text',
  filters = {},
  page = 1,
  sortBy = null,
  direction = null,
  totalResultCount,
  durationMs,
}: {
  date: string
  normalizedQuery: string | null
  queryKind?: string
  filters?: Record<string, string | string[]>
  page?: number
  sortBy?: string | null
  direction?: string | null
  totalResultCount: number
  durationMs: number
}): SearchAnalyticsEvent => ({
  normalizedQuery,
  queryKind,
  filters,
  page,
  sortBy,
  direction,
  totalResultCount,
  durationMs,
  createdAt: new Date(`${date}T12:00:00.000Z`),
})

const MOCK_SEARCH_EVENTS: SearchAnalyticsEvent[] = [
  makeEvent({
    date: '2026-03-02',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 12,
    durationMs: 118,
    filters: { categoryId: 'fyrirkoll' },
  }),
  makeEvent({
    date: '2026-03-03',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 9,
    durationMs: 124,
    filters: { categoryId: 'fyrirkoll' },
  }),
  makeEvent({
    date: '2026-03-05',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 0,
    durationMs: 141,
    filters: { categoryId: 'fyrirkoll', publication: 'A-deild' },
  }),
  makeEvent({
    date: '2026-03-06',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 6,
    durationMs: 131,
  }),
  makeEvent({
    date: '2026-03-08',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 8,
    durationMs: 120,
    page: 2,
  }),
  makeEvent({
    date: '2026-03-11',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 10,
    durationMs: 126,
    sortBy: 'publicationDate',
    direction: 'desc',
  }),
  makeEvent({
    date: '2026-03-14',
    normalizedQuery: 'fyrirkall',
    totalResultCount: 7,
    durationMs: 123,
  }),
  makeEvent({
    date: '2026-03-04',
    normalizedQuery: 'skiptalok',
    totalResultCount: 4,
    durationMs: 172,
    filters: { typeId: 'skiptalok' },
  }),
  makeEvent({
    date: '2026-03-07',
    normalizedQuery: 'skiptalok',
    totalResultCount: 5,
    durationMs: 181,
    filters: { typeId: 'skiptalok' },
  }),
  makeEvent({
    date: '2026-03-09',
    normalizedQuery: 'skiptalok',
    totalResultCount: 6,
    durationMs: 176,
  }),
  makeEvent({
    date: '2026-03-12',
    normalizedQuery: 'skiptalok',
    totalResultCount: 5,
    durationMs: 184,
    sortBy: 'publicationDate',
    direction: 'desc',
  }),
  makeEvent({
    date: '2026-03-15',
    normalizedQuery: 'skiptalok',
    totalResultCount: 4,
    durationMs: 189,
    page: 2,
  }),
  makeEvent({
    date: '2026-03-18',
    normalizedQuery: 'skiptalok',
    totalResultCount: 7,
    durationMs: 178,
  }),
  makeEvent({
    date: '2026-03-10',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 0,
    durationMs: 344,
    filters: { categoryId: 'gjaldthrot' },
  }),
  makeEvent({
    date: '2026-03-12',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 0,
    durationMs: 356,
    filters: { categoryId: 'gjaldthrot' },
  }),
  makeEvent({
    date: '2026-03-17',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 2,
    durationMs: 372,
  }),
  makeEvent({
    date: '2026-03-21',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 1,
    durationMs: 388,
    page: 2,
  }),
  makeEvent({
    date: '2026-03-24',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 0,
    durationMs: 401,
    sortBy: 'publicationDate',
    direction: 'desc',
  }),
  makeEvent({
    date: '2026-03-26',
    normalizedQuery: 'gjaldthrot',
    totalResultCount: 0,
    durationMs: 417,
  }),
  makeEvent({
    date: '2026-03-13',
    normalizedQuery: 'nafnabreyting',
    totalResultCount: 3,
    durationMs: 152,
    filters: { typeId: 'nafnabreyting' },
  }),
  makeEvent({
    date: '2026-03-16',
    normalizedQuery: 'nafnabreyting',
    totalResultCount: 2,
    durationMs: 148,
  }),
  makeEvent({
    date: '2026-03-19',
    normalizedQuery: 'nafnabreyting',
    totalResultCount: 4,
    durationMs: 161,
  }),
  makeEvent({
    date: '2026-03-22',
    normalizedQuery: 'nafnabreyting',
    totalResultCount: 3,
    durationMs: 157,
  }),
  makeEvent({
    date: '2026-03-28',
    normalizedQuery: 'nafnabreyting',
    totalResultCount: 5,
    durationMs: 164,
    sortBy: 'publicationDate',
    direction: 'desc',
  }),
  makeEvent({
    date: '2026-03-20',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 82,
  }),
  makeEvent({
    date: '2026-03-21',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 79,
  }),
  makeEvent({
    date: '2026-03-23',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 74,
  }),
  makeEvent({
    date: '2026-03-25',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 80,
  }),
  makeEvent({
    date: '2026-03-27',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 77,
  }),
  makeEvent({
    date: '2026-03-29',
    normalizedQuery: '500/2026',
    queryKind: 'publication_number',
    totalResultCount: 1,
    durationMs: 76,
  }),
  makeEvent({
    date: '2026-03-30',
    normalizedQuery: 'fyrning',
    totalResultCount: 2,
    durationMs: 143,
    filters: { publication: 'B-deild' },
  }),
  makeEvent({
    date: '2026-03-30',
    normalizedQuery: 'fasteignafelag',
    totalResultCount: 0,
    durationMs: 214,
    filters: { categoryId: 'felog' },
    page: 2,
  }),
]

export const getSearchAnalyticsOverviewMock = (
  query?: SearchAnalyticsRangeQuery,
): SearchAnalyticsOverviewResponse => {
  return buildSearchAnalyticsOverview(filterEventsByRange(query))
}

export const getSearchAnalyticsTrendsMock = (
  query?: SearchAnalyticsTrendsQuery,
): SearchAnalyticsTrendsResponse => {
  const { dateKeys } = resolveSearchAnalyticsRange(query)

  return buildSearchAnalyticsTrends(
    filterEventsByRange(query),
    dateKeys,
    query?.interval,
  )
}

export const getSearchAnalyticsBreakdownsMock = (
  query?: SearchAnalyticsRangeQuery,
): SearchAnalyticsBreakdownsResponse => {
  return buildSearchAnalyticsBreakdowns(filterEventsByRange(query))
}

export const getSearchAnalyticsQueriesMock = (
  query: SearchAnalyticsQueriesQuery,
): SearchAnalyticsQueriesResponse => {
  return buildSearchAnalyticsQueries(filterEventsByRange(query), query)
}

export const getEmptySearchAnalyticsOverview =
  (): SearchAnalyticsOverviewResponse => {
    return {
      totalSearches: 0,
      zeroResultRate: 0,
      withFiltersRate: 0,
      avgDurationMs: 0,
      p95DurationMs: 0,
      pageOneRate: 0,
    }
  }

export const getEmptySearchAnalyticsTrends =
  (): SearchAnalyticsTrendsResponse => {
    return { points: [] }
  }

export const getEmptySearchAnalyticsBreakdowns =
  (): SearchAnalyticsBreakdownsResponse => {
    return {
      queryKinds: [],
      resultBuckets: [],
      sortUsage: [],
      filterUsage: [],
    }
  }

export const getEmptySearchAnalyticsQueries = (
  type: SearchAnalyticsQueryTableType,
): SearchAnalyticsQueriesResponse => {
  return { type, rows: [] }
}
