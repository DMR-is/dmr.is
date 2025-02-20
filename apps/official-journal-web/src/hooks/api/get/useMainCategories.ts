import useSWR, { SWRConfiguration } from 'swr'

import { GetMainCategoriesResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type UseMainCategoriesParams = {
  params?: SearchParams
  options?: SWRConfiguration<GetMainCategoriesResponse, Error>
}

export const useMainCategories = ({
  params,
  options,
}: UseMainCategoriesParams = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetMainCategoriesResponse,
    Error
  >(
    [APIRoutes.GetMainCategories, params],
    ([url, params]: readonly [string, SearchParams]) =>
      fetcher(url, {
        arg: {
          method: 'GET',
          query: generateParams(params),
        },
      }),
    { ...options },
  )

  return {
    mainCategories: data?.mainCategories,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
