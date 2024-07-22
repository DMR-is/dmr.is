import useSWR, { SWRConfiguration } from 'swr'

import { GetCasesReponse } from '../../../gen/fetch'
import { APIRotues, fetchWithQueryString } from '../../../lib/constants'

type SWRCasesOptions = SWRConfiguration<GetCasesReponse, Error>

type UseCasesParams = {
  options?: SWRCasesOptions
  qsp?: string
}

export const useCases = ({ options, qsp }: UseCasesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCasesReponse,
    Error
  >(
    [APIRotues.Cases, qsp],
    ([url, qsp]: [string, string | undefined]) =>
      fetchWithQueryString(url, qsp),
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
