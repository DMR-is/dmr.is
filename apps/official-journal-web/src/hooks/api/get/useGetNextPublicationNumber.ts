import useSWR, { SWRConfiguration } from 'swr'

import { GetNextPublicationNumberResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type SWRNextPublicationNumberOptions = SWRConfiguration<
  GetNextPublicationNumberResponse,
  Error
>

type Params = {
  departmentId?: string
}

type UseNextPublicationNumberParams = {
  options?: SWRNextPublicationNumberOptions
  params?: Params
}

export const useNextPublicationNumber = ({
  options,
  params,
}: UseNextPublicationNumberParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetNextPublicationNumberResponse,
    Error
  >(
    params?.departmentId ? [APIRoutes.GetNextPublicationNumber, params] : null,
    ([url, params]: [url: string, params: Params]) =>
      fetcher<GetNextPublicationNumberResponse>(url, {
        arg: { withAuth: true, method: 'GET', query: generateParams(params) },
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
