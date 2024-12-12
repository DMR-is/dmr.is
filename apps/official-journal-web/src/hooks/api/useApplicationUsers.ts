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
import { APIRotues, fetcherV2 } from '../../lib/constants'

type UpdateApplicationUserParams = UpdateApplicationUser & { id: string }

type Props = {
  searchParams: Record<keyof GetApplicationUsersRequest, string | undefined>
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
  } = useSWR<GetApplicationUsers, Error>(
    [APIRotues.ApplicationUsers, props.searchParams],
    ([url, qp]) => {
      const qsp = new URLSearchParams()

      if (qp) {
        for (const [key, value] of Object.entries(qp)) {
          if (value) {
            qsp.append(key, value)
          }
        }
      }

      return fetcherV2<GetApplicationUsers>(url, {
        arg: { method: 'GET', query: qsp },
      })
    },
    props.config,
  )

  const {
    trigger: createApplicationUserTrigger,
    isMutating: isCreatingApplicationUser,
    error: createApplicationUserError,
  } = useSWRMutation<GetApplicationUser, Error, Key, CreateApplicationUser>(
    APIRotues.ApplicationUsers,
    (url: string, { arg }: { arg: CreateApplicationUser }) =>
      fetcherV2<GetApplicationUser, CreateApplicationUser>(url, {
        arg: { method: 'POST', body: arg },
      }),
    {
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
    APIRotues.ApplicationUser,
    (url: string, { arg }: { arg: UpdateApplicationUserParams }) => {
      const { id, ...body } = arg
      return fetcherV2<GetApplicationUser, UpdateApplicationUser>(
        url.replace(':id', arg.id),
        {
          arg: { method: 'PUT', body: body },
        },
      )
    },
    {
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
    APIRotues.ApplicationUser,
    (url: string, { arg }: { arg: DeleteApplicationUserRequest }) => {
      return fetcherV2<Response, DeleteApplicationUserRequest>(
        url.replace(':id', arg.id),
        {
          arg: { method: 'DELETE' },
        },
      )
    },
    {
      onSuccess: () => {
        props.onDeleteSuccess && props.onDeleteSuccess()
      },
    },
  )

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
