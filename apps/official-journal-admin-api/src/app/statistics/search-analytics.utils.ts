import {
  GetSearchAnalyticsQueriesQuery,
  GetSearchAnalyticsQuery,
  SearchAnalyticsBreakdownItem,
  SearchAnalyticsBreakdownsResponse,
  SearchAnalyticsInterval,
  SearchAnalyticsOverviewResponse,
  SearchAnalyticsQueriesResponse,
  SearchAnalyticsQueryRow,
  SearchAnalyticsQueryTableType,
  SearchAnalyticsTrendPoint,
  SearchAnalyticsTrendsResponse,
} from '@dmr.is/shared-dto'

import { AdvertSearchEventFilters } from './models/advert-search-event.model'

type SearchAnalyticsEvent = {
  normalizedQuery: string | null
  queryKind: string
  hasFilters: boolean
  filters: AdvertSearchEventFilters
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
  totalDurationMs: number
  totalResultCount: number
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

export const resolveSearchAnalyticsRange = (
  query?: GetSearchAnalyticsQuery,
): {
  from: string
  to: string
  fromDate: Date
  toDate: Date
  dateKeys: string[]
} => {
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

  return {
    from: toDateKey(fromDate),
    to: toDateKey(toDate),
    fromDate,
    toDate,
    dateKeys,
  }
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
    .map(([key, count]) =>
      Object.assign(new SearchAnalyticsBreakdownItem(), {
        key,
        count,
        percentage: total > 0 ? round((count / total) * 100) : 0,
      }),
    )
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
      totalDurationMs: 0,
      totalResultCount: 0,
    }

    existing.count += 1
    existing.zeroCount += event.totalResultCount === 0 ? 1 : 0
    existing.totalDurationMs += event.durationMs
    existing.totalResultCount += event.totalResultCount

    groups.set(event.normalizedQuery, existing)
  }

  return Array.from(groups.values()).filter((group) => group.count >= MIN_QUERY_COUNT)
}

const toQueryRow = (group: QueryGroup): SearchAnalyticsQueryRow => {
  const avgDurationMs = Math.round(group.totalDurationMs / group.count)
  const avgResultCount = Math.round(group.totalResultCount / group.count)

  return Object.assign(new SearchAnalyticsQueryRow(), {
    normalizedQuery: group.normalizedQuery,
    count: group.count,
    zeroResultRate: round((group.zeroCount / group.count) * 100),
    avgDurationMs,
    resultBucket: resultBucketForCount(avgResultCount),
  })
}

export const buildSearchAnalyticsOverview = (
  events: SearchAnalyticsEvent[],
): SearchAnalyticsOverviewResponse => {
  const totalSearches = events.length
  const zeroResultCount = events.filter((event) => event.totalResultCount === 0).length
  const filteredCount = events.filter((event) => event.hasFilters).length
  const pageOneCount = events.filter((event) => event.page === 1).length
  const durations = events.map((event) => event.durationMs)
  const totalDurationMs = durations.reduce((acc, value) => acc + value, 0)

  return Object.assign(new SearchAnalyticsOverviewResponse(), {
    totalSearches,
    zeroResultRate: totalSearches > 0 ? round((zeroResultCount / totalSearches) * 100) : 0,
    withFiltersRate: totalSearches > 0 ? round((filteredCount / totalSearches) * 100) : 0,
    avgDurationMs: totalSearches > 0 ? Math.round(totalDurationMs / totalSearches) : 0,
    p95DurationMs: calculateP95(durations),
    pageOneRate: totalSearches > 0 ? round((pageOneCount / totalSearches) * 100) : 0,
  })
}

export const buildSearchAnalyticsTrends = (
  events: SearchAnalyticsEvent[],
  dateKeys: string[],
  interval: SearchAnalyticsInterval = SearchAnalyticsInterval.Day,
): SearchAnalyticsTrendsResponse => {
  if (interval !== SearchAnalyticsInterval.Day) {
    throw new Error(`Unsupported interval: ${interval}`)
  }

  const grouped = new Map<string, SearchAnalyticsEvent[]>()

  for (const event of events) {
    const key = toDateKey(event.createdAt)
    const existing = grouped.get(key) ?? []
    existing.push(event)
    grouped.set(key, existing)
  }

  const points = dateKeys.map((date) => {
    const items = grouped.get(date) ?? []
    const durations = items.map((item) => item.durationMs)
    const totalDurationMs = durations.reduce((acc, value) => acc + value, 0)
    const zeroResultCount = items.filter((item) => item.totalResultCount === 0).length

    return Object.assign(new SearchAnalyticsTrendPoint(), {
      date,
      totalSearches: items.length,
      zeroResultRate:
        items.length > 0 ? round((zeroResultCount / items.length) * 100) : 0,
      avgDurationMs:
        items.length > 0 ? Math.round(totalDurationMs / items.length) : 0,
      p95DurationMs: calculateP95(durations),
    })
  })

  return Object.assign(new SearchAnalyticsTrendsResponse(), { points })
}

export const buildSearchAnalyticsBreakdowns = (
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

    for (const [key, value] of Object.entries(event.filters ?? {})) {
      if (!isMeaningfulFilterValue(value)) {
        continue
      }

      filterUsage.set(key, (filterUsage.get(key) ?? 0) + 1)
    }
  }

  return Object.assign(new SearchAnalyticsBreakdownsResponse(), {
    queryKinds: toBreakdownItems(queryKinds, total),
    resultBuckets: toBreakdownItems(resultBuckets, total),
    sortUsage: toBreakdownItems(sortUsage, total),
    filterUsage: toBreakdownItems(filterUsage, total),
  })
}

export const buildSearchAnalyticsQueries = (
  events: SearchAnalyticsEvent[],
  query: GetSearchAnalyticsQueriesQuery,
): SearchAnalyticsQueriesResponse => {
  const groups = buildQueryGroups(events)

  const rows = (() => {
    switch (query.type) {
      case SearchAnalyticsQueryTableType.Top:
        return groups
          .sort((a, b) => b.count - a.count || a.normalizedQuery.localeCompare(b.normalizedQuery))
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

            return avgB - avgA || b.count - a.count || a.normalizedQuery.localeCompare(b.normalizedQuery)
          })
          .slice(0, MAX_QUERY_ROWS)
          .map(toQueryRow)
      default:
        return []
    }
  })()

  return Object.assign(new SearchAnalyticsQueriesResponse(), {
    type: query.type,
    rows,
  })
}
