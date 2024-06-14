import useSWR, { SWRConfiguration } from 'swr'

import { GetAdvertTypesResponse } from '../../gen/fetch'
import { APIRotues, fetchWithQueryString } from '../../lib/constants'

type SWRTypesOptions = SWRConfiguration<GetAdvertTypesResponse, Error>

type UseTypesParams = {
  options?: SWRTypesOptions
  search?: string
}

export const useTypes = ({ options, search }: UseTypesParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetAdvertTypesResponse,
    Error
  >(
    [APIRotues.Types, search],
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
