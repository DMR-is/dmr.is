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

  const sort = [
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

  // Query
  const body: any = {
    from,
    size,
    query: {
      bool: {
        must: qp?.search
          ? [
              {
                multi_match: {
                  query: qp?.search,
                  type: 'best_fields',
                  fields: [
                    'title^5',
                    'title.stemmed^3',
                    'title.compound^3',
                    'department.title.stemmed^0.2',
                    'bodyText^0.9',
                    'caseNumber',
                  ],
                },
              },
            ]
          : [{ match_all: {} }],
        filter: filters,
        should,
      },
    },
    track_total_hits: true,
    sort,
    // Don’t send back these fields.
    _source: { excludes: ['bodyText', 'caseNumber'] },
  }

  return { body, alias: INDEX_ALIAS, page, size }
}
