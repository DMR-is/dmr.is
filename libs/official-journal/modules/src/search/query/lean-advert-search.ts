import {
  GetAdvertsQueryParams,
  GetLeanAdvertsResponse,
} from '@dmr.is/shared-dto'

import { getOsBody, getOsPaging } from './advert-search-query'

import { Client } from '@opensearch-project/opensearch'

export type LeanAdvertSearchResult = {
  response: GetLeanAdvertsResponse
  page: number
  size: number
  totalItems: number
  durationMs: number
}

// Runs the public advert search against OpenSearch. Shared by the public
// API's /adverts-lean, which also records the query for search analytics, and
// the admin API's advert picker, which must not.
export const searchLeanAdverts = async (
  client: Client,
  qp?: GetAdvertsQueryParams,
): Promise<LeanAdvertSearchResult> => {
  const { body, alias, page, size } = getOsBody(qp)
  const startTime = Date.now()

  const res: any = await client.search({ index: alias, body })
  const durationMs = Date.now() - startTime

  const hits = (res.body ?? res).hits
  const totalItems =
    typeof hits.total === 'number' ? hits.total : (hits.total?.value ?? 0)

  return {
    response: {
      adverts: hits.hits.map((h: any) => ({
        id: h._id,
        score: h._score,
        ...h._source,
        highlight: h.highlight,
      })),
      paging: getOsPaging(totalItems, page, size),
    },
    page,
    size,
    totalItems,
    durationMs,
  }
}
