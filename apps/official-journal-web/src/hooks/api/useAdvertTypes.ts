import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  GetMainTypesRequest,
  GetTypesRequest,
} from '../../gen/fetch'
import {
  APIRotues,
  fetcher,
  OJOIWebException,
  updateFetcher,
} from '../../lib/constants'
import { generateQueryFromParams } from '../../lib/types'

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

type TypesParams = Record<
  keyof GetTypesRequest,
  string | number | boolean | undefined
>

type MainTypeParams = Record<
  keyof GetMainTypesRequest,
  string | number | undefined
>

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
    [APIRotues.Types, typesParams],
    ([url, qsp]: [string, Record<string, string>]) => {
      const params = generateQueryFromParams(qsp)

      const fullUrl = params ? `${url}?${params}` : url

      return fetcher(fullUrl)
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

  const {
    data: mainTypesData,
    isLoading: isLoadingMainTypes,
    error: mainTypesError,
    mutate: mutateMainTypes,
  } = useSWR<GetAdvertMainTypes, OJOIWebException>(
    [APIRotues.MainTypes, mainTypesParams],
    ([url, qsp]: [string, Record<string, string>]) => {
      const params = generateQueryFromParams(qsp)

      const fullUrl = params ? `${url}?${params}` : url

      return fetcher(fullUrl)
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
    typeId ? [APIRotues.Type, typeId] : null,
    ([url, id]: [string, string]) => fetcher(url.replace(':id', id)),
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
    mainTypeId ? [APIRotues.MainType, mainTypeId] : null,
    ([url, id]: [string, string]) => {
      return fetcher(url.replace(':id', id))
    },
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
    APIRotues.MainTypes,
    async (url: string, { arg }: { arg: CreateAdvertMainTypeParams }) =>
      updateFetcher<CreateAdvertMainTypeParams>(url, {
        arg: arg,
        method: 'POST',
      }),
    {
      onSuccess: (data) => {
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
    APIRotues.Types,
    async (url: string, { arg }: { arg: CreateAdvertTypeParams }) =>
      updateFetcher<CreateAdvertTypeParams>(url, {
        arg: arg,
        method: 'POST',
      }),
    {
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
    UpdateTypeParams
  >(
    APIRotues.MainType,
    async (url: string, { arg }: { arg: UpdateTypeParams }) =>
      updateFetcher(url.replace(':id', arg.id), {
        arg: { method: 'PUT', title: arg.title, id: arg.id },
        method: 'PUT',
      }),
    {
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
    APIRotues.Type,
    (url: string, { arg }: { arg: UpdateTypeParams }) =>
      updateFetcher(url.replace(':id', arg.id), {
        arg: {
          method: 'PUT',
          title: arg.title,
          id: arg.id,
          mainTypeId: arg.mainTypeId,
        },
        method: 'PUT',
      }),

    {
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
    APIRotues.MainType,
    (url: string, { arg }: { arg: { id: string } }) =>
      fetcher(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      }),
    {
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
    APIRotues.Type,
    (url: string, { arg }: { arg: { id: string } }) =>
      fetcher(url.replace(':id', arg.id), {
        arg: { method: 'DELETE' },
      }),
    {
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
