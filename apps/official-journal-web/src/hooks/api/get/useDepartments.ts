import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  params?: SearchParams
}

export const useDepartments = ({
  options,
  params,
}: UseDepartmentsParams = {}) => {
  const query = generateQueryFromParams(params)
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
