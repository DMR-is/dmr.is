import useSWR, { SWRConfiguration } from 'swr'

import { GetCasesReponse } from '../../../gen/fetch'
import { APIRoutes, fetcherV2 } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'
import { CaseEditorialOverviewParams } from './useCaseOverview'

type SWRCasesOptions = SWRConfiguration<GetCasesReponse, Error>

type UseCasesParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params?: CaseEditorialOverviewParams
}

export const useCases = ({ options, params }: UseCasesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCasesReponse,
    Error
  >(
    [APIRoutes.GetCases, params],
    ([url, params]: [url: string, params: CaseEditorialOverviewParams]) =>
      fetcherV2(url, {
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
