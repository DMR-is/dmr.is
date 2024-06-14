import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../gen/fetch'
import { APIRotues, fetchWithQueryString } from '../../lib/constants'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  search?: string
}

export const useDepartments = ({
  options,
  search,
}: UseDepartmentsParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(
    [APIRotues.Departments, search],
    ([url, search]: [string, string | undefined]) =>
      fetchWithQueryString(url, search),
    options,
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
