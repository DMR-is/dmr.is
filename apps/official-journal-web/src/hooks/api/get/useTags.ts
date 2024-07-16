import useSWR, { SWRConfiguration } from 'swr'

import { GetTagsResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRTagsOptions = SWRConfiguration<GetTagsResponse, Error>

type UseTagsParams = {
  options?: SWRTagsOptions
}

export const useTags = ({ options }: UseTagsParams) => {
  const url = APIRotues.GetTags
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetTagsResponse,
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
