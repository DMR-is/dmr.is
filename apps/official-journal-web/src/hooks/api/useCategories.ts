import useSWR, { SWRConfiguration } from 'swr'

import { GetCategoriesResponse } from '../../gen/fetch'
import { APIRotues, fetchWithQueryString } from '../../lib/constants'

type SWRCategoriesOptions = SWRConfiguration<GetCategoriesResponse, Error>

type UseCategoriesParams = {
  options?: SWRCategoriesOptions
  search?: string
}

export const useCategories = ({
  options,
  search,
}: UseCategoriesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCategoriesResponse,
    Error
  >(
    [APIRotues.Categories, search],
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
