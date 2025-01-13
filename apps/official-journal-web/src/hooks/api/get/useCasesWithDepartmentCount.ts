import useSWR from 'swr'

import {
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountRequest,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

type UseCaseOverviewParams = {
  params?: Partial<Nullable<GetCasesWithDepartmentCountRequest>>
}

export const useCasesWithDepartmentCount = ({
  params,
}: UseCaseOverviewParams = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCasesWithDepartmentCount,
    Error
  >(
    [APIRoutes.GetCasesWithDepartmentCount, params],
    ([url, qsp]: [url: string, qsp: GetCasesWithDepartmentCountRequest]) => {
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
