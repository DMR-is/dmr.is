import useSWR, { SWRConfiguration } from 'swr'

import { GetCategoriesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

type SWRCategoriesOptions = SWRConfiguration<GetCategoriesResponse, Error>

type UseCategoriesParams = {
  options?: SWRCategoriesOptions
  query?: SearchParams
}

export const useCategories = ({ options, query }: UseCategoriesParams = {}) => {
  const url = query
    ? `${APIRotues.GetCategories}?${new URLSearchParams(query)}`
    : APIRotues.GetCategories
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCategoriesResponse,
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
