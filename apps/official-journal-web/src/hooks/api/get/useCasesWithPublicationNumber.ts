import useSWR from 'swr'

import {
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberRequest,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants-legacy'
import { generateParams } from '../../../lib/utils'

type RequestOptions = GetCasesWithPublicationNumberRequest

type UseCasesWithPublicationNumber = {
  params?: RequestOptions
}

export const useCasesWithPublicationNumber = ({
  params,
}: UseCasesWithPublicationNumber = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCasesWithPublicationNumber,
    Error
  >(
    params?.id && params.id.length > 0
      ? [APIRoutes.GetCasesWithPublicationNumber, params]
      : null,
    ([url, qsp]: [url: string, qsp: RequestOptions]) => {
      return fetcher(url, {
        arg: {
          method: 'GET',
          withAuth: true,
          query: generateParams(qsp),
        },
      })
    },
    {
      keepPreviousData: true,
      refreshInterval: 1000 * 60 * 5,
      revalidateOnFocus: false,
    },
  )

  return {
    cases: data?.cases,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
