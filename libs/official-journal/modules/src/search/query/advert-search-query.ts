import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'

import { GetAdvertsQueryParams, Paging } from '@dmr.is/shared-dto'

import { extractPhrase } from './phrase'
import {
  matchPublicationNumber,
  matchPublicationNumberPrefix,
} from './query-shape'

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

// The share of query terms that must match within a single field. Without
// this, `operator: 'or'` means one term out of four is enough to match, and
// `most_fields` then sums those weak hits across nine fields.
//
// Percentages round down, so 75% floors to 1 at two terms and only starts
// biting at three. That floor is what keeps a cross-field query such as
// "<institution> <subject>" working - not the per-field application, which is
// the hazard here: the threshold is evaluated against one field at a time,
// never across the document.
//
// The denominator also differs per field, and not in the direction the raw
// integers suggest. `title` and `bodyText` declare no analyzer, so they use
// `standard` and keep stopwords; the `.stemmed` and `.compound` variants run
// chains carrying `is_stop` and drop them.
//
// Work a five-word query with two stopwords through it: `bodyText` needs three
// of five, but two of those are stopwords that any body text supplies for
// free, so it clears on ONE content word - while `bodyText.stemmed` needs two
// of its three. Since `most_fields` matches on any field, the raw fields are
// the permissive ones and govern recall; the stemmed fields mostly shift
// ranking. `publicationNumber.full` and `caseNumber` are `keyword`, so they
// analyze to a single term and the threshold never applies to them.
const MIN_TERMS_MATCHED = '75%'

function buildTextQuery(search: string) {
  return {
    multi_match: {
      query: search,
      type: 'most_fields',
      operator: 'or',
      minimum_should_match: MIN_TERMS_MATCHED,
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

// How much an adjacent-words match is worth on top of the normal bag-of-words
// score. Tuning knob - raise it if phrase hits should dominate more strongly.
const PHRASE_RANK_BOOST = 3

// Publication-number hits sit far above the text-field weights on purpose:
// someone who types a publication number is not asking for the adverts that
// cite it, they are asking for the one that carries it. The serial boost is
// shared by the complete `number/year` and the still-being-typed prefix, so
// both rank the same advert the same way.
const PUBLICATION_NUMBER_FULL_BOOST = 400
const PUBLICATION_NUMBER_SERIAL_BOOST = 45
const PUBLICATION_NUMBER_YEAR_BOOST = 30
const PUBLICATION_NUMBER_BODY_BOOST = 50

// Fields that phrase matching can safely target. `.compound` is deliberately
// excluded: the dictionary_decompounder emits subwords at the same position as
// their parent token, so adjacency on that field is not meaningful.
const PHRASE_FIELDS = [
  'title^5',
  'involvedParty.title.stemmed^5',
  'title.stemmed^3',
  'bodyText.stemmed^0.9',
]

function buildPhraseQuery(phrase: string, boost?: number) {
  return {
    multi_match: {
      query: phrase,
      type: 'phrase',
      fields: PHRASE_FIELDS,
      // Boosted (ranking) use is allowed a little slack so near-adjacent
      // matches still benefit. Quoted search stays strict.
      slop: boost === undefined ? 0 : 1,
      ...(boost === undefined ? {} : { boost }),
    },
  }
}

// Prefix matching runs the user's fragment through the field's own analyzer,
// which makes the unstemmed fields the reliable ones: a partial word has no
// predictable stem, and `is_stop` can delete the fragment outright. The
// stemmed fields are kept alongside for the cases where they do resolve.
const PREFIX_FIELDS = [
  { field: 'title', boost: 8, slop: 2 },
  { field: 'title.stemmed', boost: 8, slop: 2 },
  { field: 'involvedParty.title', boost: 5, slop: 1 },
  { field: 'involvedParty.title.stemmed', boost: 5, slop: 1 },
]

function buildPrefixQuery(prefixValue: string) {
  return {
    bool: {
      should: PREFIX_FIELDS.map(({ field, boost, slop }) => ({
        match_phrase_prefix: {
          [field]: {
            query: prefixValue,
            slop,
            max_expansions: 50,
            boost,
          },
        },
      })),
      minimum_should_match: 1,
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
  const phrase = extractPhrase(q)

  const pageSize = Math.min(Math.max(1, qp?.pageSize ?? 20), 100)
  // OpenSearch rejects from + size > index.max_result_window (default 10000).
  // Clamp page so deep pagination degrades gracefully instead of throwing.
  const MAX_RESULT_WINDOW = 10000
  const maxPage = Math.max(1, Math.floor(MAX_RESULT_WINDOW / pageSize))
  const page = Math.min(Math.max(1, Number(qp?.page ?? 1)), maxPage)
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
  const publicationNumber = matchPublicationNumber(q)
  const should: any[] = []
  if (publicationNumber) {
    const { number, year, full } = publicationNumber

    // Strong boosts on exact fields
    should.push({
      term: {
        'publicationNumber.full': {
          value: full,
          boost: PUBLICATION_NUMBER_FULL_BOOST,
        },
      },
    })
    should.push({
      term: {
        'publicationNumber.number': {
          value: number,
          boost: PUBLICATION_NUMBER_SERIAL_BOOST,
        },
      },
    })
    should.push({
      term: {
        'publicationNumber.year': {
          value: year,
          boost: PUBLICATION_NUMBER_YEAR_BOOST,
        },
      },
    })

    // Weaker boosts if the pair appears in bodyText as adjacent tokens
    should.push({
      match_phrase: {
        bodyText: {
          query: `${number} ${year}`,
          boost: PUBLICATION_NUMBER_BODY_BOOST,
        },
      },
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
  const publicationNumberPrefix = matchPublicationNumberPrefix(q)

  if (q) {
    if (phrase) {
      // PHRASE MODE
      // The whole query was quoted, so the user asked for adjacency rather
      // than a bag of words. Require the phrase instead of OR-ing tokens.
      must.push(buildPhraseQuery(phrase))
    } else if (publicationNumberPrefix) {
      // PARTIAL PUBLICATION NUMBER MODE
      // The serial number is unreachable from buildTextQuery: `.full` is a
      // keyword field that only matches a complete `number/year`, and the
      // integer `.number` is not among its fields at all. So the advert that
      // *carries* the number cannot match on it, while every advert whose
      // title merely cites it matches at title^5 - which is why searching
      // `1009` returned the adverts amending 1009/2010 and not 1009/2010.
      //
      // A `should` boost does not fix that. `should` only reorders what `must`
      // has already admitted, and the advert was never admitted. The serial
      // has to be an alternative arm of `must` to affect recall, and it
      // carries its boost there rather than being repeated below.
      must.push({
        bool: {
          should: [
            buildTextQuery(q),
            {
              term: {
                'publicationNumber.number': {
                  value: publicationNumberPrefix,
                  boost: PUBLICATION_NUMBER_SERIAL_BOOST,
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      })
    } else if (wildcardMatch && !q.includes(' ')) {
      const prefixValue = wildcardMatch[1]

      must.push(buildPrefixQuery(prefixValue))

      should.push(buildTextQuery(prefixValue))
    } else {
      // NORMAL MODE
      must.push(buildTextQuery(q))

      // Rank documents where the words actually appear next to each other
      // above those that merely contain them somewhere. Recall is unchanged;
      // this only contributes score.
      if (q.includes(' ')) {
        should.push(buildPhraseQuery(q, PHRASE_RANK_BOOST))
      }
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
