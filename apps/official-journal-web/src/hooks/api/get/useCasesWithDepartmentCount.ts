import useSWR from 'swr'

import {
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountRequest,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants-legacy'
import { NullableExcept } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type UseCasesWithDepartmentCountParams = {
  params?: NullableExcept<GetCasesWithDepartmentCountRequest, 'department'>
}

export const useCasesWithDepartmentCount = ({
  params,
}: UseCasesWithDepartmentCountParams = {}) => {
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
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  )

  return {
    caseOverview: data,
    paging: data?.paging,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
