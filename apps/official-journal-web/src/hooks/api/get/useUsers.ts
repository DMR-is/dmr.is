import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetUsersRequest, GetUsersResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseCaseParams = {
  params?: GetUsersRequest
  options?: SWRConfiguration<GetUsersResponse, Error>
}

export const useUsers = ({ params = {}, options }: UseCaseParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session ? ['getUsers', session?.user, params] : null,
    ([_key, _user, params]) =>
      swrFetcher({
        func: () => dmrClient.getUsers(params),
      }),
    {
      ...options,
    },
  )

  return {
    users: data?.users,
    paging: data?.paging,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
