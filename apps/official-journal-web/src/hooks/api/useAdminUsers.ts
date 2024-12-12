import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  CreateAdminUser,
  GetAdminUsers,
  UpdateAdminUser,
} from '../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../lib/constants'

type DeleteUser = {
  id: string
}

type UpdateUser = {
  id: string
  body: UpdateAdminUser
}

type Props = {
  onCreateSuccess?: () => void
  onCreateError?: (error: Error) => void
  onUpdateSuccess?: () => void
  onUpdateError?: (error: Error) => void
  onDeleteSuccess?: () => void
  onDeleteError?: (error: Error) => void
  config?: SWRConfiguration
}

export const useAdminUsers = ({
  onCreateError,
  onCreateSuccess,
  onDeleteError,
  onDeleteSuccess,
  onUpdateError,
  onUpdateSuccess,
  config,
}: Props = {}) => {
  const {
    data,
    isLoading: isLoadingUsers,
    error: usersError,
    mutate: refetchUsers,
  } = useSWR<GetAdminUsers, Error>(
    APIRotues.AdminUsers,
    (url: string) =>
      fetcherV2<GetAdminUsers>(url, {
        arg: { method: 'GET' },
      }),
    config,
  )

  const {
    trigger: createUserTrigger,
    isMutating: isCreatingUser,
    error: createUserError,
  } = useSWRMutation<Response, Error, Key, CreateAdminUser>(
    APIRotues.AdminUsers,
    (url: string, { arg }: { arg: CreateAdminUser }) =>
      fetcherV2<Response, CreateAdminUser>(url, {
        arg: { method: 'POST', body: arg },
      }),
    {
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
    APIRotues.AdminUser,
    (url: string, { arg }: { arg: UpdateUser }) =>
      fetcherV2<Response, UpdateAdminUser>(url.replace(':id', arg.id), {
        arg: { method: 'PUT', body: arg.body },
      }),
    {
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
    APIRotues.AdminUser,
    (url: string, { arg }: { arg: DeleteUser }) =>
      fetcherV2<Response>(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      }),
    {
      onError: (error) => {
        onDeleteError && onDeleteError(error)
      },
      onSuccess: () => {
        onDeleteSuccess && onDeleteSuccess()
      },
    },
  )

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
    users: data?.users,
    isLoadingUsers,
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
