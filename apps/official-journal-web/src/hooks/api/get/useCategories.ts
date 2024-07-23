import useSWR, { SWRConfiguration } from 'swr'

import { GetCategoriesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRCategoriesOptions = SWRConfiguration<GetCategoriesResponse, Error>

type UseCategoriesParams = {
  options?: SWRCategoriesOptions
  params?: SearchParams
}

export const useCategories = ({
  options,
  params,
}: UseCategoriesParams = {}) => {
  const query = generateQueryFromParams(params)
  const url = query
    ? `${APIRotues.GetCategories}?${query}`
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
