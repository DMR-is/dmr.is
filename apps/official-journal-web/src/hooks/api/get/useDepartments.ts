import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  query?: string
}

export const useDepartments = ({
  options,
  query,
}: UseDepartmentsParams = {}) => {
  const url = query
    ? `${APIRotues.GetDepartments}?${query}`
    : APIRotues.GetDepartments

  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(url, fetcher, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
