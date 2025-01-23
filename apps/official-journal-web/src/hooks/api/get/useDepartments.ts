import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type Params = Record<keyof SearchParams, string | number>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  params?: Params
}

export const useDepartments = ({
  options,
  params,
}: UseDepartmentsParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(
    [APIRoutes.GetDepartments, params],
    ([url, qsp]: [url: string, qsp: Params]) =>
      fetcher(url, {
        arg: {
          method: 'GET',
          query: generateParams(qsp),
        },
      }),
    {
      revalidateOnFocus: false,
      ...options,
    },
  )

  return {
    departments: data?.departments,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
