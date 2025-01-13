import useSWR from 'swr'

import {
  GetCasesWithStatusCount,
  GetCasesWithStatusCountRequest,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type UseGetCasesWithStatusCount = {
  params?: Partial<GetCasesWithStatusCountRequest>
}

export const useCasesWithStatusCount = ({
  params,
}: UseGetCasesWithStatusCount = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCasesWithStatusCount,
    Error
  >(
    [APIRoutes.GetCasesWithStatusCount, params],
    ([url, qsp]: [url: string, qsp: GetCasesWithStatusCountRequest]) =>
      fetcher(url, {
        arg: {
          method: 'GET',
          withAuth: true,
          query: generateParams(qsp),
        },
      }),
    {
      refreshInterval: 1000 * 60 * 5,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  return {
    cases: data?.cases,
    paging: data?.paging,
    statuses: data?.statuses,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
