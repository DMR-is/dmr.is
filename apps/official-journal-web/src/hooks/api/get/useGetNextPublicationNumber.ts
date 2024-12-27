import useSWR, { SWRConfiguration } from 'swr'

import { GetNextPublicationNumberResponse } from '../../../gen/fetch'
import { APIRoutes, fetcherV2 } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type SWRNextPublicationNumberOptions = SWRConfiguration<
  GetNextPublicationNumberResponse,
  Error
>

type Params = {
  departmentId: string
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
    [APIRoutes.GetNextPublicationNumber, params],
    ([url, params]: [url: string, params: Params]) =>
      fetcherV2<GetNextPublicationNumberResponse>(url, {
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
