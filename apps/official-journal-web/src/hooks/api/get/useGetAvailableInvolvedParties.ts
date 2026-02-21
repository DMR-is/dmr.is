import { useSession } from 'next-auth/react'

import useSWR, { SWRConfiguration } from 'swr'

import { GetInstitutionsFullResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants-legacy'

type UseGetAvailableInvolvedPartiesParams = {
  caseId: string
  options?: SWRConfiguration<GetInstitutionsFullResponse, Error>
}

export const useGetAvailableInvolvedParties = ({
  caseId,
  options,
}: UseGetAvailableInvolvedPartiesParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session && caseId
      ? ['getCaseAvailableInvolvedParties', session?.user, caseId]
      : null,
    ([_key, _user, id]) =>
      swrFetcher({
        func: () => dmrClient.getCaseAvailableInvolvedParties({ caseId: id }),
      }),
    {
      ...options,
      throwOnError: false,
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
