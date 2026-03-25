import { createHash } from 'crypto'

import { GetPublicationsQueryDto } from './dto/publication.dto'
import {
  PublicationSearchQueryKind,
  PublicationSearchTrackingEventDto,
  PublicationSearchTrackingFiltersDto,
  PublicationSearchTrackingResultDto,
} from './dto/publication-search-tracking.dto'

const PUBLICATION_NUMBER_PATTERN = /^\d{11}$/

const normalizeQuery = (query?: string): string => {
  return (query ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const normalizeArrayFilter = (value?: string[]): string[] | undefined => {
  if (value == null) {
    return undefined
  }

  const normalized = value
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  if (normalized.length === 0) {
    return undefined
  }

  return Array.from(new Set(normalized))
}

const normalizeDateFilter = (value?: Date): string | undefined => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined
  }

  return value.toISOString()
}

export const classifyPublicationSearchQuery = (
  query?: string,
): {
  normalizedQuery: string | null
  queryHash: string | null
  queryKind: PublicationSearchQueryKind
  queryLength: number
  queryTokenCount: number
} => {
  const normalized = normalizeQuery(query)

  if (!normalized) {
    return {
      normalizedQuery: null,
      queryHash: null,
      queryKind: PublicationSearchQueryKind.Empty,
      queryLength: 0,
      queryTokenCount: 0,
    }
  }

  const queryKind = PUBLICATION_NUMBER_PATTERN.test(normalized)
    ? PublicationSearchQueryKind.PublicationNumber
    : PublicationSearchQueryKind.FreeText

  return {
    normalizedQuery: normalized,
    queryHash: createHash('sha256').update(normalized, 'utf8').digest('hex'),
    queryKind,
    queryLength: normalized.length,
    queryTokenCount: normalized.split(/\s+/).filter(Boolean).length,
  }
}

export const normalizePublicationSearchFilters = (
  query?: GetPublicationsQueryDto,
): PublicationSearchTrackingFiltersDto => {
  const filters = new PublicationSearchTrackingFiltersDto()
  const categoryId = normalizeArrayFilter(query?.categoryId)
  const dateFrom = normalizeDateFilter(query?.dateFrom)
  const dateTo = normalizeDateFilter(query?.dateTo)

  if (query?.advertId) {
    filters.advertId = query.advertId
  }

  if (dateFrom) {
    filters.dateFrom = dateFrom
  }

  if (dateTo) {
    filters.dateTo = dateTo
  }

  if (query?.typeId) {
    filters.typeId = query.typeId
  }

  if (categoryId) {
    filters.categoryId = categoryId
  }

  if (query?.version) {
    filters.version = query.version
  }

  return filters
}

export const buildPublicationSearchTrackingEvent = (
  query: GetPublicationsQueryDto | undefined,
  result: PublicationSearchTrackingResultDto,
): PublicationSearchTrackingEventDto => {
  const classifiedQuery = classifyPublicationSearchQuery(query?.search)
  const filters = normalizePublicationSearchFilters(query)

  return Object.assign(new PublicationSearchTrackingEventDto(), {
    route: '/api/v1/publications',
    backend: 'postgres',
    normalizedQuery: classifiedQuery.normalizedQuery,
    queryHash: classifiedQuery.queryHash,
    queryKind: classifiedQuery.queryKind,
    queryLength: classifiedQuery.queryLength,
    queryTokenCount: classifiedQuery.queryTokenCount,
    hasFilters: Object.keys(filters).length > 0,
    filters,
    page: result.page,
    pageSize: result.pageSize,
    pageResultCount: result.pageResultCount,
    totalResultCount: result.totalResultCount,
    durationMs: result.durationMs,
  })
}
