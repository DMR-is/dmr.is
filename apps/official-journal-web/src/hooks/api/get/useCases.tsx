import useSWR, { SWRConfiguration } from 'swr'

import { GetCasesReponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams } from '../../../lib/types'
import { CaseEditorialOverviewParams } from './useCaseOverview'

type SWRCasesOptions = SWRConfiguration<GetCasesReponse, Error>

type UseCasesParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params?: CaseEditorialOverviewParams
}

export const useCases = ({
  shouldFetch = true,
  options,
  params,
}: UseCasesParams = {}) => {
  const query = generateQueryFromParams(params)
  const url = query ? `${APIRotues.GetCases}?${query}` : APIRotues.GetCases
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCasesReponse,
    Error
  >(shouldFetch ? url : null, fetcher, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
