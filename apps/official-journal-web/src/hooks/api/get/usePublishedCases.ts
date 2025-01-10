import useSWR from 'swr'

import {
  GetFinishedCasesRequest,
  GetPublishedCasesResponse,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

type UseCaseOverviewParams = {
  params?: Partial<Nullable<GetFinishedCasesRequest>>
}

export const usePublishedCases = ({ params }: UseCaseOverviewParams = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetPublishedCasesResponse,
    Error
  >(
    [APIRoutes.GetPublishedCases, params],
    ([url, qsp]: [url: string, qsp: GetFinishedCasesRequest]) => {
      return fetcher(url, {
        arg: {
          method: 'GET',
          withAuth: true,
          query: generateParams(qsp),
        },
      })
    },
    {
      refreshInterval: 1000 * 60 * 5,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  return {
    caseOverview: data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
