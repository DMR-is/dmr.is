import useSWR, { SWRConfiguration } from 'swr'

import { GetMainCategoriesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRMainCategoriesOptions = SWRConfiguration<
  GetMainCategoriesResponse,
  Error
>

type UseMainCategoriesParams = {
  options?: SWRMainCategoriesOptions
  params?: SearchParams
}

export const useMainCategories = ({
  options,
  params,
}: UseMainCategoriesParams = {}) => {
  const query = generateQueryFromParams(params)
  const url = query
    ? `${APIRotues.GetMainCategories}?${query}`
    : APIRotues.GetMainCategories
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetMainCategoriesResponse,
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
