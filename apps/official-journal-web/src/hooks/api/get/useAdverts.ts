import useSWR, { SWRConfiguration } from 'swr'
import { GetAdvertsQuery } from '@dmr.is/shared/dto'

import { GetAdvertsResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type SWRCasesOptions = SWRConfiguration<GetAdvertsResponse, Error>

type UseAdvertsParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params?: GetAdvertsQuery
}

export const useAdverts = ({ options, params }: UseAdvertsParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetAdvertsResponse,
    Error
  >(
    [APIRoutes.Adverts, params],
    ([url, params]: [url: string, params: GetAdvertsQuery]) =>
      fetcher(url, {
        arg: {
          withAuth: true,
          method: 'GET',
          query: generateParams(params),
        },
      }),
    options,
  )
  console.log(data, error)
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
