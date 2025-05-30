import { useSession } from 'next-auth/react'

import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  CreateUserRequest,
  DeleteUserRequest,
  GetUserResponse,
  GetUsersRequest,
  GetUsersResponse,
  UpdateUserRequest,
} from '../../gen/fetch'
import { getDmrClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/constants'

type CreateUserConfiguration = SWRMutationConfiguration<
  GetUserResponse,
  Error,
  Key,
  CreateUserRequest
>

type UpdateUserConfiguration = SWRMutationConfiguration<
  GetUserResponse,
  Error,
  Key,
  UpdateUserRequest
>

type DeleteUserConfiguration = SWRMutationConfiguration<
  { id: string },
  Error,
  Key,
  DeleteUserRequest
>

type UseCaseParams = {
  params?: GetUsersRequest
  options?: SWRConfiguration<GetUsersResponse, Error>
  createUserOptions?: CreateUserConfiguration
  updateUserOptions?: UpdateUserConfiguration
  deleteUserOptions?: DeleteUserConfiguration
}

export const useUsers = ({
  params = {},
  options,
  createUserOptions,
  updateUserOptions,
  deleteUserOptions,
}: UseCaseParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session ? ['getUsers', session.user, params] : null,
    ([_key, _user, params]) =>
      swrFetcher({
        func: () => dmrClient.getUsers(params),
      }),
    {
      ...options,
    },
  )

  const { data: involedParties, mutate: getUserInvoledParties } = useSWR(
    session ? ['getUserInvoledParties', session.user] : null,
    ([_key, _user]) =>
      swrFetcher({
        func: () => dmrClient.getInvolvedPartiesByUser(),
      }),
    {
      keepPreviousData: true,
      revalidateOnFocus: true,
    },
  )

  const { trigger: createUser } = useSWRMutation<
    GetUserResponse,
    Error,
    Key,
    CreateUserRequest
  >(
    session ? ['createUser', session.user] : null,
    (_key: string, { arg }: { arg: CreateUserRequest }) =>
      swrFetcher({
        func: () => dmrClient.createUser(arg),
      }),
    {
      ...createUserOptions,
      throwOnError: false,
    },
  )

  const { trigger: updateUser } = useSWRMutation<
    GetUserResponse,
    Error,
    Key,
    UpdateUserRequest
  >(
    session ? ['updateUser', session.user] : null,
    (_key: string, { arg }: { arg: UpdateUserRequest }) =>
      swrFetcher({
        func: () => dmrClient.updateUser(arg),
      }),
    {
      ...updateUserOptions,
      throwOnError: false,
    },
  )

  const { trigger: deleteUser } = useSWRMutation<
    { id: string },
    Error,
    Key,
    DeleteUserRequest
  >(
    session ? ['deleteUser', session.user] : null,
    (_key: string, { arg }: { arg: DeleteUserRequest }) => {
      swrFetcher({
        func: () => dmrClient.deleteUser(arg),
      })

      return { id: arg.id }
    },
    {
      ...deleteUserOptions,
      throwOnError: false,
    },
  )

  return {
    users: data?.users,
    paging: data?.paging,
    involedParties,
    getUserInvoledParties,
    error,
    isLoading,
    isValidating,
    mutate,
    createUser,
    updateUser,
    deleteUser,
  }
}
