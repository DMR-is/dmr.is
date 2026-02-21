import useSWR, { SWRConfiguration } from 'swr'

import { GetTagsResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

type SWRTagsOptions = SWRConfiguration<GetTagsResponse, Error>

type UseTagsParams = {
  options?: SWRTagsOptions
}

export const useTags = ({ options }: UseTagsParams) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetTagsResponse,
    Error
  >(
    APIRoutes.GetTags,
    (url) =>
      fetcher(url, {
        arg: { withAuth: true, method: 'GET' },
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
