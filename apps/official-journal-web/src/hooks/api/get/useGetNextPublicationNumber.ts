import useSWR, { SWRConfiguration } from 'swr'

import { GetNextPublicationNumberResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import { generateQueryFromParams } from '../../../lib/types'

type SWRNextPublicationNumberOptions = SWRConfiguration<
  GetNextPublicationNumberResponse,
  Error
>

type UseNextPublicationNumberParams = {
  options?: SWRNextPublicationNumberOptions
  params?: {
    departmentId: string
  }
}

export const useNextPublicationNumber = ({
  options,
  params,
}: UseNextPublicationNumberParams = {}) => {
  const query = generateQueryFromParams(params)
  const url = query
    ? `${APIRotues.GetNextPublicationNumber}?${query}`
    : APIRotues.GetNextPublicationNumber

  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetNextPublicationNumberResponse,
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
