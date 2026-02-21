import { useSession } from 'next-auth/react'

import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import {
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetMainTypesRequest,
} from '../../gen/fetch'
import { getDmrClient } from '../../lib/api/createClient'
import { OJOIWebException, swrFetcher } from '../../lib/constants-legacy'

type MainTypeIdParam = {
  id: string
}

type CreateAdvertMainTypeParams = {
  departmentId: string
  title: string
}
export type UpdateMainTypeParams = {
  id: string
  title?: string
}

type MainTypeParams = Partial<
  Record<keyof GetMainTypesRequest, string | number | undefined>
>

type UseMainTypesParams = {
  mainTypesParams?: Partial<MainTypeParams>
  mainTypeId?: string
  onCreateMainTypeSuccess?: (data: GetAdvertMainType) => void
  onUpdateMainTypeSuccess?: (datA: GetAdvertMainType) => void
  onDeleteMainTypeSuccess?: () => void
}

export const useMainTypes = ({
  mainTypesParams,
  mainTypeId,
  onCreateMainTypeSuccess,
  onUpdateMainTypeSuccess,
  onDeleteMainTypeSuccess,
}: UseMainTypesParams = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data: mainTypesData,
    isLoading: isLoadingMainTypes,
    error: mainTypesError,
    mutate: mutateMainTypes,
  } = useSWR<GetAdvertMainTypes, OJOIWebException>(
    session ? ['getMainTypes', session.user, mainTypesParams] : null,
    ([_key, _user, qsp]: [string, unknown, GetMainTypesRequest]) =>
      swrFetcher({
        func: () => dmrClient.getMainTypes(qsp || {}),
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

  const {
    data: mainTypeData,
    isLoading: isLoadingMainType,
    error: mainTypeError,
    mutate: mutateMainType,
  } = useSWR<GetAdvertMainType, OJOIWebException>(
    session && mainTypeId
      ? ['getMainTypeById', session.user, mainTypeId]
      : null,
    ([_key, _user, id]: [string, unknown, string]) =>
      swrFetcher({
        func: () => dmrClient.getMainTypeById({ id: id }),
      }),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

  const {
    trigger: createMainTypeTrigger,
    isMutating: isCreatingMainType,
    error: createMainTypeError,
  } = useSWRMutation<
    GetAdvertMainType,
    OJOIWebException,
    Key,
    CreateAdvertMainTypeParams
  >(
    session ? 'createMainType' : null,
    async (_key: string, { arg }: { arg: CreateAdvertMainTypeParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.createMainType({
            createAdvertMainTypeBody: {
              departmentId: arg.departmentId,
              title: arg.title,
            },
          }),
      }),

    {
      throwOnError: false,
      onSuccess: (data) => {
        toast.success(`Tegund ${data.mainType.title} stofnuð`)
        onCreateMainTypeSuccess && onCreateMainTypeSuccess(data)
      },
    },
  )

  const {
    trigger: updateMainTypeTrigger,
    isMutating: isUpdatingMainType,
    error: updateMainTypeError,
  } = useSWRMutation<
    GetAdvertMainType,
    OJOIWebException,
    Key,
    UpdateMainTypeParams
  >(
    session ? 'updateMainType' : null,
    async (_key: string, { arg }: { arg: UpdateMainTypeParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.updateMainType({
            id: arg.id,
            updateAdvertMainType: {
              title: arg.title,
            },
          }),
      }),
    {
      throwOnError: false,
      onSuccess: (data) => {
        onUpdateMainTypeSuccess && onUpdateMainTypeSuccess(data)
      },
    },
  )

  const {
    trigger: deleteMainTypeTrigger,
    isMutating: isDeletingMainType,
    error: deleteMainTypeError,
  } = useSWRMutation<void, OJOIWebException, Key, MainTypeIdParam>(
    session ? 'deleteMainType' : null,
    (_key: string, { arg }: { arg: { id: string } }) =>
      swrFetcher({
        func: () =>
          dmrClient.deleteMainType({
            id: arg.id,
          }),
      }),
    {
      throwOnError: false,
      onSuccess: () => {
        onDeleteMainTypeSuccess && onDeleteMainTypeSuccess()
      },
    },
  )

  const createMainType = (params: CreateAdvertMainTypeParams) => {
    createMainTypeTrigger(params)
  }

  const updateMainType = (params: UpdateMainTypeParams) => {
    updateMainTypeTrigger(params)
  }

  const deleteMainType = (params: MainTypeIdParam) => {
    deleteMainTypeTrigger(params)
  }

  return {
    mainType: mainTypeData?.mainType,
    isLoadingMainType,
    mainTypeError,
    refetchMainType: mutateMainType,
    mainTypes: mainTypesData?.mainTypes,
    isLoadingMainTypes,
    mainTypesError,
    refetchMainTypes: mutateMainTypes,
    isCreatingMainType,
    isUpdatingMainType,
    isDeletingMainType,
    createMainType,
    updateMainType,
    deleteMainType,
    createMainTypeError,
    updateMainTypeError,
    deleteMainTypeError,
  }
}
