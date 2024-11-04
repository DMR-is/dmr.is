import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  params?: SearchParams
}

export const useMainCategories = ({
  options,
  params,
}: UseDepartmentsParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(APIRotues.GetMainCategories, fetcher, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
