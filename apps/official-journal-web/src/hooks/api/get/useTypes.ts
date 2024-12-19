import useSWR, { SWRConfiguration } from 'swr'

import { GetAdvertTypes, GetTypesRequest } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRTypesOptions = SWRConfiguration<GetAdvertTypes, Error>

type UseTypesParams = {
  options?: SWRTypesOptions
  params?: GetTypesRequest
}

export const useTypes = ({ options, params }: UseTypesParams) => {
  const query = params
    ? Object.keys(params)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(
              (params as Record<string, string | number>)[key],
            )}`,
        )
        .join('&')
    : ''

  const url = query ? `${APIRotues.Types}?${query}` : APIRotues.Types
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetAdvertTypes,
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
