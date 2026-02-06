import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'

import { GetAdvertsQueryParams, Paging } from '@dmr.is/shared/dto'

function normalizeToArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }

  return []
}

function termFilter(rawValue: string | string[], field: string) {
  const values = normalizeToArray(rawValue)

  if (values.length === 0) return

  if (values.length === 1) {
    return {
      term: {
        [field]: values[0],
      },
    }
  } else {
    return {
      terms: {
        [field]: values,
      },
    }
  }
}

export const getOsPaging = (
  totalItems: number,
  page: number,
  size: number,
): Paging => {
  const totalPages = Math.max(1, Math.ceil(totalItems / size))

  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  const paging = {
    page,
    totalPages,
    totalItems,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
    pageSize: size,
    hasNextPage,
    hasPreviousPage,
  }
  return paging
}

function buildTextQuery(search: string) {
  return {
    multi_match: {
      query: search,
      type: 'most_fields',
      operator: 'or',
      fields: [
        'title^5',
        'involvedParty.title.stemmed^5',
        'title.stemmed^3',
        'title.compound^3',
        'department.title.stemmed^0.2',
        'bodyText.stemmed^0.9',
        'bodyText^0.4',
        'publicationNumber.full',
        'caseNumber',
      ],
    },
  }
}

function buildSort(qp?: GetAdvertsQueryParams): any[] {
  const sortBy = qp?.sortBy?.toLowerCase()
  const direction = qp?.direction?.toUpperCase() === 'DESC' ? 'desc' : 'asc'

  // Default sort (used when no sortBy is specified)
  const defaultSort = [
    { _score: 'desc' },
    {
      publicationDate: {
        order: 'desc',
        unmapped_type: 'date',
        missing: '_last',
      },
    },
    { _id: 'desc' },
  ]

  if (!sortBy) {
    return defaultSort
  }

  if (sortBy === 'date' || sortBy === 'publicationdate') {
    return [
      {
        publicationDate: {
          order: direction,
          unmapped_type: 'date',
          missing: '_last',
        },
      },
      { _id: 'desc' },
    ]
  }

  if (sortBy === 'number' || sortBy === 'publicationnumber') {
    // Sort by year first, then by number within year
    return [
      {
        'publicationNumber.year': {
          order: direction,
          unmapped_type: 'long',
          missing: '_last',
        },
      },
      {
        'publicationNumber.number': {
          order: direction,
          unmapped_type: 'long',
          missing: '_last',
        },
      },
      { _id: 'desc' },
    ]
  }

  // If sortBy is not recognized, use default
  return defaultSort
}

export const getOsBody = (
  qp?: GetAdvertsQueryParams,
): { body: any; alias: string; page: number; size: number } => {
  const INDEX_ALIAS = process.env.ADVERTS_SEARCH_ALIAS ?? 'ojoi_search'
  const q = qp?.search?.trim() ?? ''

  const pageSize = Math.min(Math.max(1, qp?.pageSize ?? 20), 100)
  const page = Math.max(1, Number(qp?.page ?? 1))
  const from = (page - 1) * pageSize
  const size = pageSize

  // Build filters
  const filters: any[] = []
  if (qp?.department) filters.push(termFilter(qp.department, 'department.slug'))
  if (qp?.type) {
    filters.push(termFilter(qp.type, 'type.slug'))
  }
  if (qp?.category) {
    filters.push(termFilter(qp.category, 'categories.slug'))
  }
  if (qp?.involvedParty) {
    filters.push(termFilter(qp.involvedParty, 'involvedParty.slug'))
  }
  if (qp?.mainType) {
    filters.push(termFilter(qp.mainType, 'mainType.slug'))
  }
  if (qp?.year) {
    filters.push({ term: { 'publicationNumber.year': qp.year } })
  }
  if (qp?.dateFrom || qp?.dateTo) {
    filters.push({
      range: {
        publicationDate: {
          gte: qp.dateFrom ? startOfDay(new Date(qp.dateFrom)) : undefined,
          lte: qp.dateTo ? endOfDay(new Date(qp.dateTo)) : undefined,
        },
      },
    })
  }

  // Detect "number/year"
  const m = q.match(/^\s*(\d+)\s*\/\s*(\d{4})\s*$/)
  const should: any[] = []
  if (m) {
    const number = String(parseInt(m[1], 10))
    const year = m[2]
    const full = `${number}/${year}`

    // Strong boosts on exact fields
    should.push({
      term: { 'publicationNumber.full': { value: full, boost: 400 } },
    })
    should.push({
      term: { 'publicationNumber.number': { value: number, boost: 45 } },
    })
    should.push({
      term: { 'publicationNumber.year': { value: year, boost: 30 } },
    })

    // Weaker boosts if the pair appears in bodyText as adjacent tokens
    should.push({
      match_phrase: { bodyText: { query: `${number} ${year}`, boost: 50 } },
    })
  }

  // Direct lookup by 11‑digit internal case number
  const isInternalCase = /^\d{11}$/.test(qp?.search ?? '')
  if (isInternalCase) {
    should.push({
      term: { caseNumber: { value: qp?.search, boost: 400 } },
    })
  }

  // Build sort configuration
  const sort = buildSort(qp)

  const must: any[] = []

  const wildcardMatch = q.match(/^(\S+)\*$/)

  if (q) {
    if (wildcardMatch && !q.includes(' ')) {
      const prefixValue = wildcardMatch[1]

      must.push({
        bool: {
          should: [
            {
              match_phrase_prefix: {
                'title.stemmed': {
                  query: prefixValue,
                  slop: 2,
                  max_expansions: 50,
                  boost: 8,
                },
              },
            },
            {
              match_phrase_prefix: {
                'involvedParty.title.stemmed': {
                  query: prefixValue,
                  slop: 1,
                  max_expansions: 50,
                  boost: 5,
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      })

      should.push(buildTextQuery(prefixValue))
    } else {
      // NORMAL MODE
      must.push(buildTextQuery(q))
    }
  } else {
    must.push({ match_all: {} })
  }

  // Query
  const hasTextQuery = !!q
  const body: any = {
    from,
    size,
    query: {
      bool: {
        must,
        filter: filters,
        should,
        minimum_should_match: 0,
      },
    },
    track_total_hits: hasTextQuery ? 200 : true, // Cap at 200 to avoid performance issues
    sort,
    // Don't send back these fields.
    _source: { excludes: ['bodyText', 'caseNumber'] },
  }

  return { body, alias: INDEX_ALIAS, page, size }
}
