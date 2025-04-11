import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetAdvertsRequest, GetAdvertsResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type SWRCasesOptions = SWRConfiguration<GetAdvertsResponse, Error>

type UseAdvertsParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params: GetAdvertsRequest
}

export const useAdverts = ({ options, params }: UseAdvertsParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session ? ['getAdverts', session?.user] : null,
    ([_key, _user]) =>
      swrFetcher({
        func: () => dmrClient.getAdverts(params),
      }),
    {
      ...options,
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
