import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  params?: Record<keyof SearchParams, string | number>
}

export const useDepartments = ({
  options,
  params,
}: UseDepartmentsParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(
    [APIRotues.GetDepartments, params],
    ([url, qsp]: [url: string, qsp: Record<string, string>]) => {
      const query = new URLSearchParams(qsp)

      const fullUrl = `${url}?${query.toString()}`

      return fetcher(fullUrl)
    },
    options,
  )

  return {
    departments: data?.departments,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
