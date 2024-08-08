import useSWR, { SWRConfiguration } from 'swr'

import { GetCommunicationSatusesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRCommunicationStatusesOptions = SWRConfiguration<
  GetCommunicationSatusesResponse,
  Error
>

type UseCommunicationStatusesParams = {
  options?: SWRCommunicationStatusesOptions
}

export const useCommunicationStatuses = ({
  options,
}: UseCommunicationStatusesParams = {}) => {
  const url = APIRotues.GetCommunicationStatuses

  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCommunicationSatusesResponse,
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
