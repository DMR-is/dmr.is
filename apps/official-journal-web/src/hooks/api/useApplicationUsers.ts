import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  CreateApplicationUser,
  DeleteApplicationUserRequest,
  GetApplicationUser,
  GetApplicationUsers,
  GetApplicationUsersRequest,
  UpdateApplicationUser,
} from '../../gen/fetch'
import { APIRoutes, fetcher } from '../../lib/constants'

type UpdateApplicationUserParams = UpdateApplicationUser & { id: string }

type Props = {
  searchParams?: Record<keyof GetApplicationUsersRequest, string | undefined>
  config?: SWRConfiguration
  onCreateSuccess?: (user: GetApplicationUser) => void
  onUpdateSuccess?: (user: GetApplicationUser) => void
  onDeleteSuccess?: () => void
}

export const useApplicationUsers = (props: Props) => {
  const {
    data,
    isLoading: applicationUsersLoading,
    error: applicationUsersError,
    mutate,
  } = useSWR<GetApplicationUsers, Error>(
    [APIRoutes.ApplicationUsers, props.searchParams],
    ([url, qp]) => {
      const qsp = new URLSearchParams()

      if (qp) {
        for (const [key, value] of Object.entries(qp)) {
          if (value) {
            qsp.append(key, value)
          }
        }
      }

      return fetcher<GetApplicationUsers>(url, {
        arg: { withAuth: true, method: 'GET', query: qsp },
      })
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  const {
    trigger: createApplicationUserTrigger,
    isMutating: isCreatingApplicationUser,
    error: createApplicationUserError,
  } = useSWRMutation<GetApplicationUser, Error, Key, CreateApplicationUser>(
    APIRoutes.ApplicationUsers,
    (url: string, { arg }: { arg: CreateApplicationUser }) =>
      fetcher<GetApplicationUser, CreateApplicationUser>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
    {
      throwOnError: false,
      onSuccess: (user) => {
        props.onCreateSuccess && props.onCreateSuccess(user)
      },
    },
  )

  const {
    trigger: updateApplicationUserTrigger,
    isMutating: isUpdatingApplicationUser,
    error: updateApplicationUserError,
  } = useSWRMutation<
    GetApplicationUser,
    Error,
    Key,
    UpdateApplicationUserParams
  >(
    APIRoutes.ApplicationUser,
    (url: string, { arg }: { arg: UpdateApplicationUserParams }) => {
      const { id, ...body } = arg
      return fetcher<GetApplicationUser, UpdateApplicationUser>(
        url.replace(':id', arg.id),
        {
          arg: { withAuth: true, method: 'PUT', body: body },
        },
      )
    },
    {
      throwOnError: false,
      onSuccess: (user) => {
        props.onUpdateSuccess && props.onUpdateSuccess(user)
      },
    },
  )

  const {
    trigger: deleteApplicationUserTrigger,
    isMutating: isDeletingApplicationUser,
    error: deleteApplicationUserError,
  } = useSWRMutation<Response, Error, Key, DeleteApplicationUserRequest>(
    APIRoutes.ApplicationUser,
    (url: string, { arg }: { arg: DeleteApplicationUserRequest }) => {
      return fetcher<Response, DeleteApplicationUserRequest>(
        url.replace(':id', arg.id),
        {
          arg: { withAuth: true, method: 'DELETE' },
        },
      )
    },
    {
      throwOnError: false,
      onSuccess: () => {
        props.onDeleteSuccess && props.onDeleteSuccess()
      },
    },
  )

  const getApplicationUsers = () => {
    mutate()
  }

  const createApplicationUser = (body: CreateApplicationUser) => {
    createApplicationUserTrigger({ ...body })
  }

  const updateApplicationUser = (body: UpdateApplicationUserParams) => {
    updateApplicationUserTrigger({ ...body })
  }

  const deleteApplicationUser = (id: string) => {
    deleteApplicationUserTrigger({ id })
  }

  return {
    getApplicationUsers,
    applicationUsers: data?.users,
    applicationUsersLoading,
    applicationUsersError,
    isCreatingApplicationUser,
    createApplicationUser,
    createApplicationUserError,
    isUpdatingApplicationUser,
    updateApplicationUser,
    updateApplicationUserError,
    isDeletingApplicationUser,
    deleteApplicationUser,
    deleteApplicationUserError,
  }
}
