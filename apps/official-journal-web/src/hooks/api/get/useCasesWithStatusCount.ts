import useSWR from 'swr'

import {
  GetCasesWithStatusCount,
  GetCasesWithStatusCountRequest,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { NullableExcept } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type UseGetCasesWithStatusCount = {
  params?: NullableExcept<GetCasesWithStatusCountRequest, 'status'>
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
      keepPreviousData: true,
      revalidateOnFocus: false,
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
