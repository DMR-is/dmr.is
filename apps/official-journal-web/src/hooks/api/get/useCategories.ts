import useSWR, { SWRConfiguration } from 'swr'

import { GetCategoriesResponse } from '../../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type SWRCategoriesOptions = SWRConfiguration<GetCategoriesResponse, Error>

type UseCategoriesParams = {
  options?: SWRCategoriesOptions
  params?: SearchParams
}

export const useCategories = ({
  options,
  params,
}: UseCategoriesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCategoriesResponse,
    Error
  >(
    [APIRotues.GetCategories, params],
    ([url, qsp]: [url: string, qsp: SearchParams]) =>
      fetcherV2(url, {
        arg: {
          method: 'GET',
          query: generateParams(qsp),
        },
      }),
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
