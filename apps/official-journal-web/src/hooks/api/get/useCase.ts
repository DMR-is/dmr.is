import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetCaseResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseCaseParams = {
  caseId: string
  options?: SWRConfiguration<GetCaseResponse, Error>
}

export const useCase = ({ caseId, options }: UseCaseParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string, session?.apiBasePath)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session ? ['getCase', session?.user, caseId] : null,
    ([_key, _user, id]) =>
      swrFetcher({
        func: () => dmrClient.getCase({ id }),
      }),
    {
      ...options,
    },
  )

  return {
    case: data?._case,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
