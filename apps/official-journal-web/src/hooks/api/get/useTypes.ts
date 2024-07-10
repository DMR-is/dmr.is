import useSWR, { SWRConfiguration } from 'swr'

import { GetAdvertTypesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRTypesOptions = SWRConfiguration<GetAdvertTypesResponse, Error>

type UseTypesParams = {
  options?: SWRTypesOptions
  query?: string
}

export const useTypes = ({ options, query }: UseTypesParams) => {
  const url = query ? `${APIRotues.GetTypes}?${query}` : APIRotues.GetTypes
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetAdvertTypesResponse,
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
