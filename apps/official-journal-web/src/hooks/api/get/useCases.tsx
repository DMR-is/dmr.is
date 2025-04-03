import useSWR, { SWRConfiguration } from 'swr'

import { GetCasesReponse, GetCasesRequest } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type SWRCasesOptions = SWRConfiguration<GetCasesReponse, Error>

type UseCasesParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params?: GetCasesRequest
}

export const useCases = ({ options, params }: UseCasesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCasesReponse,
    Error
  >(
    [APIRoutes.GetCases, params],
    ([url, params]: [url: string, params: GetCasesRequest]) =>
      fetcher(url, {
        arg: {
          withAuth: true,
          method: 'GET',
          query: generateParams(params),
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
