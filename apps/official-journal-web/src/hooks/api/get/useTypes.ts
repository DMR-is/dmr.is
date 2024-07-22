import useSWR, { SWRConfiguration } from 'swr'

import { GetAdvertTypesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRTypesOptions = SWRConfiguration<GetAdvertTypesResponse, Error>

type UseTypesParams = {
  options?: SWRTypesOptions
  params?: SearchParams & { department?: string }
}

export const useTypes = ({ options, params }: UseTypesParams) => {
  const query = generateQueryFromParams(params)
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
