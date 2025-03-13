import { useSession } from 'next-auth/react'
import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  CreateUserRequest,
  GetUserResponse,
  GetUsersRequest,
  GetUsersResponse,
} from '../../gen/fetch'
import { getDmrClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/constants'

type CreateUserConfiguration = SWRMutationConfiguration<
  GetUserResponse,
  Error,
  Key,
  CreateUserRequest
>

type UseCaseParams = {
  params?: GetUsersRequest
  options?: SWRConfiguration<GetUsersResponse, Error>
  createUserOptions?: CreateUserConfiguration
}

export const useUsers = ({
  params = {},
  options,
  createUserOptions,
}: UseCaseParams) => {
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

  const { trigger: createUser } = useSWRMutation<
    GetUserResponse,
    Error,
    Key,
    CreateUserRequest
  >(
    session ? ['createUser', session?.user] : null,
    (_key: string, { arg }: { arg: CreateUserRequest }) =>
      dmrClient.createUser(arg),
    {
      ...createUserOptions,
      throwOnError: false,
    },
  )

  return {
    users: data?.users,
    paging: data?.paging,
    error,
    isLoading,
    isValidating,
    mutate,
    createUser,
  }
}
