import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  AdminUser,
  CreateAdminUser,
  GetAdminUser,
  GetAdminUsers,
  UpdateAdminUser,
} from '../../gen/fetch'
import { APIRoutes, fetcherV2 } from '../../lib/constants'

type DeleteUser = {
  id: string
}

type UpdateUser = {
  id: string
  body: UpdateAdminUser
}

type Props = {
  adminUserId?: string | null
  onGetUserSuccess?: (user: AdminUser) => void
  onCreateSuccess?: () => void
  onCreateError?: (error: Error) => void
  onUpdateSuccess?: () => void
  onUpdateError?: (error: Error) => void
  onDeleteSuccess?: () => void
  onDeleteError?: (error: Error) => void
}

export const useAdminUsers = ({
  adminUserId,
  onGetUserSuccess,
  onCreateError,
  onCreateSuccess,
  onDeleteError,
  onDeleteSuccess,
  onUpdateError,
  onUpdateSuccess,
}: Props = {}) => {
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
    isValidating: isUserValidating,
    mutate: refetchUser,
  } = useSWR<GetAdminUser, Error>(
    adminUserId ? [APIRoutes.AdminUser, adminUserId] : null,
    ([url, id]: [url: string, id: string]) =>
      fetcherV2(url.replace(':id', id), {
        arg: { withAuth: true, method: 'GET' },
      }),
    {
      onSuccess: ({ user }) => {
        onGetUserSuccess && onGetUserSuccess(user)
      },
      refreshInterval: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  )

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    isValidating: isUsersValidating,
    mutate: refetchUsers,
  } = useSWR<GetAdminUsers, Error>(
    APIRoutes.AdminUsers,
    (url: string) =>
      fetcherV2<GetAdminUsers>(url, {
        arg: { withAuth: true, method: 'GET' },
      }),
    {
      refreshInterval: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  )

  const {
    trigger: createUserTrigger,
    isMutating: isCreatingUser,
    error: createUserError,
  } = useSWRMutation<Response, Error, Key, CreateAdminUser>(
    APIRoutes.AdminUsers,
    (url: string, { arg }: { arg: CreateAdminUser }) =>
      fetcherV2<Response, CreateAdminUser>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
    {
      throwOnError: false,
      onError: (error) => {
        onCreateError && onCreateError(error)
      },
      onSuccess: () => {
        onCreateSuccess && onCreateSuccess()
      },
    },
  )

  const {
    trigger: updateUserTrigger,
    isMutating: isUpdatingUser,
    error: updateUserError,
  } = useSWRMutation<Response, Error, Key, UpdateUser>(
    APIRoutes.AdminUser,
    (url: string, { arg }: { arg: UpdateUser }) =>
      fetcherV2<Response, UpdateAdminUser>(url.replace(':id', arg.id), {
        arg: { withAuth: true, method: 'PUT', body: arg.body },
      }),
    {
      throwOnError: false,
      onError: (error) => {
        onUpdateError && onUpdateError(error)
      },
      onSuccess: () => {
        onUpdateSuccess && onUpdateSuccess()
      },
    },
  )

  const {
    trigger: deleteUserTrigger,
    isMutating: isDeletingUser,
    error: deleteUserError,
  } = useSWRMutation<Response, Error, Key, DeleteUser>(
    APIRoutes.AdminUser,
    (url: string, { arg }: { arg: DeleteUser }) =>
      fetcherV2<Response>(url.replace(':id', arg.id), {
        arg: { withAuth: true, method: 'DELETE' },
      }),
    {
      throwOnError: false,
      onError: (error) => {
        onDeleteError && onDeleteError(error)
      },
      onSuccess: () => {
        onDeleteSuccess && onDeleteSuccess()
      },
    },
  )

  const getUser = () => {
    refetchUser()
  }

  const getUsers = () => {
    refetchUsers()
  }

  const createUser = (body: CreateAdminUser) => {
    createUserTrigger(body)
  }

  const updateUser = ({ id, body }: UpdateUser) => {
    updateUserTrigger({ id, body })
  }

  const deleteUser = ({ id }: DeleteUser) => {
    deleteUserTrigger({ id })
  }

  return {
    user: userData?.user,
    isLoadingUser,
    userError,
    getUser,
    isUserValidating,
    users: usersData?.users,
    isLoadingUsers,
    isUsersValidating,
    usersError,
    getUsers,
    createUser,
    isCreatingUser,
    createUserError,
    updateUser,
    isUpdatingUser,
    updateUserError,
    deleteUser,
    isDeletingUser,
    deleteUserError,
  }
}
