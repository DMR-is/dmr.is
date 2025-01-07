import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@island.is/island-ui/core'

import {
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  GetMainTypesRequest,
  GetTypesRequest,
} from '../../gen/fetch'
import { APIRoutes, fetcher, OJOIWebException } from '../../lib/constants'
import { generateParams } from '../../lib/utils'

type AdvertTypeIdParam = {
  id: string
}

type CreateAdvertTypeParams = {
  departmentId: string
  mainTypeId?: string
  title: string
}

export type UpdateTypeParams = {
  id: string
  mainTypeId?: string | null
  title?: string
}

export type CreateAdvertMainTypeParams = Omit<
  CreateAdvertTypeParams,
  'mainTypeId'
>

type TypesParams = Partial<
  Record<keyof GetTypesRequest, string | number | boolean | undefined>
>

type MainTypeParams = Partial<
  Record<keyof GetMainTypesRequest, string | number | undefined>
>

type UpdateMainTypeParams = Omit<UpdateTypeParams, 'mainTypeId'>

type UseAdvertTypesParams = {
  typesParams?: Partial<TypesParams>
  mainTypesParams?: Partial<MainTypeParams>
  typeId?: string
  mainTypeId?: string
  onCreateTypeSuccess?: (data: GetAdvertType) => void
  onCreateMainTypeSuccess?: (data: GetAdvertMainType) => void
  onUpdateTypeSuccess?: (data: GetAdvertType) => void
  onUpdateMainTypeSuccess?: (datA: GetAdvertMainType) => void
  onDeleteTypeSuccess?: () => void
  onDeleteMainTypeSuccess?: () => void
}

export const useAdvertTypes = ({
  typesParams,
  mainTypesParams,
  typeId,
  mainTypeId,
  onCreateMainTypeSuccess,
  onCreateTypeSuccess,
  onUpdateMainTypeSuccess,
  onUpdateTypeSuccess,
  onDeleteMainTypeSuccess,
  onDeleteTypeSuccess,
}: UseAdvertTypesParams = {}) => {
  const {
    data: typesData,
    isLoading: isLoadingTypes,
    error: typesError,
    mutate: mutateTypes,
  } = useSWR<GetAdvertTypes, OJOIWebException>(
    [APIRoutes.Types, typesParams],
    ([url, qsp]: [string, TypesParams]) => {
      return fetcher(url, {
        arg: { method: 'GET', query: generateParams(qsp) },
      })
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
      suspense: true,
      fallbackData: { types: [] },
    },
  )

  const {
    data: mainTypesData,
    isLoading: isLoadingMainTypes,
    error: mainTypesError,
    mutate: mutateMainTypes,
  } = useSWR<GetAdvertMainTypes, OJOIWebException>(
    [APIRoutes.MainTypes, mainTypesParams],
    ([url, qsp]: [string, Record<string, string>]) => {
      return fetcher(url, {
        arg: { method: 'GET', query: generateParams(qsp) },
      })
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

  const {
    data: typeData,
    isLoading: isLoadingType,
    error: typeError,
    mutate: mutateType,
  } = useSWR<GetAdvertType, OJOIWebException>(
    typeId ? [APIRoutes.Type, typeId] : null,
    ([url, id]: [string, string]) =>
      fetcher(url.replace(':id', id), { arg: { method: 'GET' } }),
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
    mainTypeId ? [APIRoutes.MainType, mainTypeId] : null,
    ([url, id]: [string, string]) =>
      fetcher(url.replace(':id', id), { arg: { method: 'GET' } }),
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
    APIRoutes.MainTypes,
    async (url: string, { arg }: { arg: CreateAdvertMainTypeParams }) =>
      fetcher<GetAdvertMainType, CreateAdvertMainTypeParams>(url, {
        arg: {
          body: arg,
          method: 'POST',
        },
      }),
    {
      throwOnError: false,
      onSuccess: (data) => {
        toast.success(`Yfirflokkur ${data.mainType.title} stofnaður`)
        onCreateMainTypeSuccess && onCreateMainTypeSuccess(data)
      },
    },
  )

  const {
    trigger: createTypeTrigger,
    isMutating: isCreatingType,
    error: createTypeError,
  } = useSWRMutation<
    GetAdvertType,
    OJOIWebException,
    Key,
    CreateAdvertTypeParams
  >(
    APIRoutes.Types,
    async (url: string, { arg }: { arg: CreateAdvertTypeParams }) =>
      fetcher<GetAdvertType, CreateAdvertTypeParams>(url, {
        arg: {
          method: 'POST',
          body: arg,
        },
      }),
    {
      throwOnError: false,
      onSuccess: (data) => {
        onCreateTypeSuccess && onCreateTypeSuccess(data)
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
    APIRoutes.MainType,
    async (url: string, { arg }: { arg: UpdateMainTypeParams }) =>
      fetcher<GetAdvertMainType, UpdateMainTypeParams>(
        url.replace(':id', arg.id),
        {
          arg: {
            method: 'PUT',
            body: arg,
          },
        },
      ),
    {
      throwOnError: false,
      onSuccess: (data) => {
        onUpdateMainTypeSuccess && onUpdateMainTypeSuccess(data)
      },
    },
  )

  const {
    trigger: updateTypeTrigger,
    isMutating: isUpdatingType,
    error: updateTypeError,
  } = useSWRMutation<GetAdvertType, OJOIWebException, Key, UpdateTypeParams>(
    APIRoutes.Type,
    (url: string, { arg }: { arg: UpdateTypeParams }) =>
      fetcher<GetAdvertType, UpdateTypeParams>(url.replace(':id', arg.id), {
        arg: {
          method: 'PUT',
          body: arg,
        },
      }),

    {
      throwOnError: false,
      onSuccess: (data) => {
        onUpdateTypeSuccess && onUpdateTypeSuccess(data)
      },
    },
  )

  const {
    trigger: deleteMainTypeTrigger,
    isMutating: isDeletingMainType,
    error: deleteMainTypeError,
  } = useSWRMutation<Response, OJOIWebException, Key, AdvertTypeIdParam>(
    APIRoutes.MainType,
    (url: string, { arg }: { arg: { id: string } }) =>
      fetcher<Response>(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      }),
    {
      throwOnError: false,
      onSuccess: () => {
        onDeleteMainTypeSuccess && onDeleteMainTypeSuccess()
      },
    },
  )

  const {
    trigger: deleteTypeTrigger,
    isMutating: isDeletingType,
    error: deleteTypeError,
  } = useSWRMutation<Response, OJOIWebException, Key, AdvertTypeIdParam>(
    APIRoutes.Type,
    (url: string, { arg }: { arg: { id: string } }) =>
      fetcher<Response>(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      }),
    {
      throwOnError: false,
      onSuccess: () => {
        onDeleteTypeSuccess && onDeleteTypeSuccess()
      },
    },
  )

  const createMainType = (params: CreateAdvertMainTypeParams) => {
    createMainTypeTrigger(params)
  }

  const createType = (params: CreateAdvertTypeParams) => {
    createTypeTrigger(params)
  }

  const updateMainType = (params: UpdateTypeParams) => {
    updateMainTypeTrigger(params)
  }

  const updateType = (params: UpdateTypeParams) => {
    updateTypeTrigger(params)
  }

  const deleteMainType = (params: AdvertTypeIdParam) => {
    deleteMainTypeTrigger(params)
  }

  const deleteType = (params: AdvertTypeIdParam) => {
    deleteTypeTrigger(params)
  }

  return {
    type: typeData?.type,
    isLoadingType,
    typeError,
    refetchType: mutateType,
    mainType: mainTypeData?.mainType,
    isLoadingMainType,
    mainTypeError,
    refetchMainType: mutateMainType,
    types: typesData?.types,
    isLoadingTypes,
    typesError,
    refetchTypes: mutateTypes,
    mainTypes: mainTypesData?.mainTypes,
    isLoadingMainTypes,
    mainTypesError,
    refetchMainTypes: mutateMainTypes,
    isCreatingMainType,
    isCreatingType,
    isUpdatingMainType,
    isUpdatingType,
    isDeletingMainType,
    isDeletingType,
    createType,
    createMainType,
    updateType,
    updateMainType,
    deleteType,
    deleteMainType,
    createMainTypeError,
    createTypeError,
    updateMainTypeError,
    updateTypeError,
    deleteMainTypeError,
    deleteTypeError,
  }
}
