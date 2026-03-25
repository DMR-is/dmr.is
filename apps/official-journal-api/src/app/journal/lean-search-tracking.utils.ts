import { createHash } from 'crypto'

import { GetAdvertsQueryParams } from '@dmr.is/shared-dto'

import {
  LeanSearchQueryKind,
  LeanSearchTrackingEventDto,
  LeanSearchTrackingFiltersDto,
  LeanSearchTrackingResultDto,
} from './lean-search-tracking.dto'

const INTERNAL_CASE_NUMBER_PATTERN = /^\d{11}$/
const PUBLICATION_NUMBER_PATTERN = /^(\d+)\s*\/\s*(\d{4})$/
const PREFIX_WILDCARD_PATTERN = /^(\S+)\*$/

const normalizeQuery = (query?: string): string => {
  return (query ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const normalizeArrayFilter = (
  value?: string | string[],
): string[] | undefined => {
  if (value == null) {
    return undefined
  }

  const values = Array.isArray(value) ? value : value.split(',')
  const normalized = values
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  if (normalized.length === 0) {
    return undefined
  }

  return Array.from(new Set(normalized))
}

export const classifyLeanSearchQuery = (
  query?: string,
): {
  normalizedQuery: string | null
  queryKind: LeanSearchQueryKind
  queryHash: string | null
  queryLength: number
  queryTokenCount: number
} => {
  const normalized = normalizeQuery(query)

  if (!normalized) {
    return {
      normalizedQuery: null,
      queryKind: LeanSearchQueryKind.Empty,
      queryHash: null,
      queryLength: 0,
      queryTokenCount: 0,
    }
  }

  let normalizedQuery = normalized
  let queryKind: LeanSearchQueryKind = LeanSearchQueryKind.FreeText

  if (INTERNAL_CASE_NUMBER_PATTERN.test(normalized)) {
    queryKind = LeanSearchQueryKind.InternalCaseNumber
  } else {
    const publicationNumberMatch = normalized.match(PUBLICATION_NUMBER_PATTERN)

    if (publicationNumberMatch) {
      queryKind = LeanSearchQueryKind.PublicationNumber
      normalizedQuery = `${parseInt(publicationNumberMatch[1], 10)}/${publicationNumberMatch[2]}`
    } else {
      const wildcardMatch = normalized.match(PREFIX_WILDCARD_PATTERN)

      if (wildcardMatch && !normalized.includes(' ')) {
        queryKind = LeanSearchQueryKind.PrefixWildcard
        normalizedQuery = wildcardMatch[1]
      }
    }
  }

  return {
    normalizedQuery,
    queryKind,
    queryHash: createHash('sha256')
      .update(normalizedQuery, 'utf8')
      .digest('hex'),
    queryLength: normalizedQuery.length,
    queryTokenCount: normalizedQuery.split(/\s+/).filter(Boolean).length,
  }
}

export const normalizeLeanSearchFilters = (
  params?: GetAdvertsQueryParams,
): LeanSearchTrackingFiltersDto => {
  const filters = new LeanSearchTrackingFiltersDto()

  const department = normalizeArrayFilter(params?.department)
  const type = normalizeArrayFilter(params?.type)
  const mainType = normalizeArrayFilter(params?.mainType)
  const category = normalizeArrayFilter(params?.category)
  const involvedParty = normalizeArrayFilter(params?.involvedParty)

  if (department) {
    filters.department = department
  }
  if (type) {
    filters.type = type
  }
  if (mainType) {
    filters.mainType = mainType
  }
  if (category) {
    filters.category = category
  }
  if (involvedParty) {
    filters.involvedParty = involvedParty
  }
  if (params?.year) {
    filters.year = params.year
  }
  if (params?.dateFrom) {
    filters.dateFrom = params.dateFrom
  }
  if (params?.dateTo) {
    filters.dateTo = params.dateTo
  }

  return filters
}

export const buildLeanSearchTrackingEvent = (
  params: GetAdvertsQueryParams | undefined,
  result: LeanSearchTrackingResultDto,
): LeanSearchTrackingEventDto => {
  const query = classifyLeanSearchQuery(params?.search)
  const filters = normalizeLeanSearchFilters(params)

  return Object.assign(new LeanSearchTrackingEventDto(), {
    route: '/api/v1/adverts-lean',
    backend: 'opensearch',
    normalizedQuery: query.normalizedQuery,
    queryHash: query.queryHash,
    queryKind: query.queryKind,
    queryLength: query.queryLength,
    queryTokenCount: query.queryTokenCount,
    hasFilters: Object.keys(filters).length > 0,
    filters,
    page: result.page,
    pageSize: result.pageSize,
    sortBy: params?.sortBy ?? null,
    direction: params?.direction?.toUpperCase() ?? null,
    pageResultCount: result.pageResultCount,
    totalResultCount: result.totalResultCount,
    durationMs: result.durationMs,
  })
}
