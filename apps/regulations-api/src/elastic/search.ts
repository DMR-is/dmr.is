import { Client, errors } from '@opensearch-project/opensearch'
import range from '@hugsmidjan/qj/range'
import zeroPad from '@hugsmidjan/qj/zeroPad'
import { ensureReasonableYear } from '@island.is/regulations-tools/utils'
import esb from 'elastic-builder'
import xss from 'xss'

import { PER_PAGE } from '../db/Regulations'
import {
  ISODate,
  Ministry,
  PlainText,
  RegName,
  RegulationListItem,
  RegulationSearchResults,
} from '../routes/types'
// import { RegulationsIndexBody } from './populate';

export type SearchQueryParams = {
  q?: string // query
  year?: string // regulationYear
  yearTo?: string // regulationYear arnge to
  rn?: string // ministry slug
  ch?: string // lawchapter slug
  iA?: string // 'true' to include amending regulations
  iR?: string // 'true' to include repelled regulations
  page?: string // pagination page
}

const cleanQuery = (q: string | undefined) =>
  q && xss(q).replace(/\s+/g, ' ').trim().toLowerCase()

// eslint-disable-next-line complexity
export async function searchElastic(client: Client, query: SearchQueryParams) {
  let searchQuery = cleanQuery(query.q)

  const nameSearch: Array<esb.Query> = []

  // add filters
  const filters: Array<esb.Query> = []

  const iAQuery = query.iA === 'true'
  const iRQuery = query.iR === 'true'
  const yearFrom = ensureReasonableYear(query.year)

  if (!iAQuery) {
    filters.push(esb.termQuery('type', 'base'))
  }
  if (!iRQuery) {
    filters.push(esb.termQuery('repealed', false))
  }
  if (yearFrom) {
    const yearTo = Math.max(yearFrom, ensureReasonableYear(query.yearTo) || 0)
    const years = range(yearFrom, yearTo)
    filters.push(esb.termsQuery('year', years))
  }
  if (query.rn) {
    filters.push(esb.termQuery('ministrySlug', xss(query.rn)))
  }
  if (query.ch) {
    filters.push(esb.termQuery('lawChaptersSlugs', xss(query.ch)))
  }

  const activeFilters = Boolean(
    iAQuery || iRQuery || yearFrom || query.rn || query.ch,
  )

  // build text search
  const textSearch: Array<esb.Query> = []

  if (searchQuery) {
    const names: Array<string> = []
    searchQuery = searchQuery
      .split(/\s+/)
      .map((word) => {
        const nameRe = /^(\d{1,4})\s*[-/]\s*((?:19|20)\d{2})$/
        const m = word.match(nameRe)
        if (m) {
          const [_, number, year] = m as [string, string, string]
          const numberPadded = zeroPad(parseInt(number), 4)
          names.push(numberPadded + '/' + year)
          return `"${number}-${year}"`
        } else if (/^\d{1,4}[*]?$/.test(word)) {
          const numberPadded = zeroPad(parseInt(word), 4)
          names.push(numberPadded + '*')
        }
        return word.replace(/\//g, '\\/')
      })
      .join(' ')

    names.forEach((name) => {
      nameSearch.push(
        name.includes('*')
          ? esb.queryStringQuery(name).fields(['name^50'])
          : esb.queryStringQuery(`"${name}"`).fields(['name^100']),
      )
    })

    textSearch.push(
      esb
        .queryStringQuery(searchQuery)
        // .escape(true)
        .fields([
          'title^23',
          'title.stemmed^20',
          // 'title.compound^10',
          'text^7',
          'text.stemmed^5',
          // 'text.compound^1',
        ]),
    )
  } else if (activeFilters) {
    textSearch.push(
      esb.queryStringQuery('*').analyzeWildcard(true).fields(['title']),
    )
  }

  const searchSections: Array<esb.Query> = [
    // String searches must be filtered for repealed state, regulation type, ministry, etc., etc.
    esb.boolQuery().must(textSearch).filter(filters),
  ]
  if (nameSearch.length) {
    // Name searches, however, should ignore all filters.
    // Just return the the named regulations regardless of their state.
    searchSections.push(
      esb.boolQuery().should(nameSearch).minimumShouldMatch(1),
    )
  }

  // build search body
  const requestBody = esb
    .requestBodySearch()
    .query(esb.boolQuery().should(searchSections).minimumShouldMatch(1))
    .sorts([esb.sort('_score', 'desc'), esb.sort('publishedDate', 'desc')])

  // esb.prettyPrint(requestBody);

  let totalItems = 0
  const pagingPage = Math.max(parseInt('' + query.page) || 1, 1)
  let searchHits: Array<RegulationListItem> = []

  if (activeFilters || textSearch.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let elasticResponse: Record<string, any> = {}

    try {
      elasticResponse = await client.search({
        index: 'regulations',
        size: PER_PAGE,
        body: requestBody.toJSON(),
        from: (pagingPage - 1) * PER_PAGE,
      })
    } catch (err) {
      const value = err instanceof errors.ResponseError ? err.meta : err
      console.error(value)
      // console.error((err as any).body.error.failed_shards);
    }

    type MockElasticHits = {
      hits?: Array<{
        _source: {
          name: RegName
          title: PlainText
          publishedDate: ISODate
          ministry: Ministry
        }
      }>
      total?: { value?: number }
    }

    const hits =
      (elasticResponse.body as unknown as { hits: MockElasticHits } | undefined)
        ?.hits || {}

    searchHits =
      hits.hits?.map((hit) => {
        return {
          name: hit._source.name,
          title: hit._source.title,
          publishedDate: hit._source.publishedDate,
          ministry: hit._source.ministry,
        }
      }) || []

    totalItems = hits.total?.value ?? 0
  }

  const results: RegulationSearchResults = {
    page: pagingPage,
    perPage: PER_PAGE,
    totalPages: Math.ceil(totalItems / PER_PAGE),
    totalItems,
    data: searchHits,
  }

  return results
}
