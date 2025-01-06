import useSWR, { SWRConfiguration } from 'swr'

import { GetCommunicationSatusesResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type SWRCommunicationStatusesOptions = SWRConfiguration<
  GetCommunicationSatusesResponse,
  Error
>

type UseCommunicationStatusesParams = {
  options?: SWRCommunicationStatusesOptions
}

export const useCommunicationStatuses = ({
  options,
}: UseCommunicationStatusesParams) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCommunicationSatusesResponse,
    Error
  >(
    APIRoutes.GetCommunicationStatuses,
    (url: string) =>
      fetcher(url, {
        arg: {
          method: 'GET',
        },
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
