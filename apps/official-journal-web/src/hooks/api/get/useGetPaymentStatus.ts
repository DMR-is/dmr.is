import { useSession } from 'next-auth/react'

import useSWR, { SWRConfiguration } from 'swr'

import { GetPaymentResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UsePaymentStatusParams = {
  caseId: string
  options?: SWRConfiguration<GetPaymentResponse, Error>
}

export const useGetPaymentStatus = ({
  caseId,
  options,
}: UsePaymentStatusParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session && caseId ? ['getCasePaymentStatus', session?.user, caseId] : null,
    ([_key, _user, id]) =>
      swrFetcher({
        func: () => dmrClient.getCasePaymentStatus({ id }),
      }),
    {
      ...options,
      throwOnError: false,
      // Cache for 2 minutes
      dedupingInterval: 1000 * 60 * 2,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
