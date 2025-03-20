import useSWR, { SWRConfiguration } from 'swr'

import { GetPaymentResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UsePaymentStatusParams = {
  caseId: string
  options?: SWRConfiguration<GetPaymentResponse, Error>
}

export const useGetPaymentStatus = ({
  caseId, options,
}: UsePaymentStatusParams) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetPaymentResponse,
    Error
  >(
    caseId ? [APIRoutes.GetPaymentStatus, caseId] : null,
    ([url, id]: [url: string, id: string]) =>
      fetcher(url.replace(':id', id), {
        arg: { withAuth: true, method: 'GET' },
      }),
    { ...options },
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
