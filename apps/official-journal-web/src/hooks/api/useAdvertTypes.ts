import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { GetAdvertType, GetAdvertTypes, GetTypesRequest } from '../../gen/fetch'
import { APIRoutes, fetcher, OJOIWebException } from '../../lib/constants'
import { generateParams } from '../../lib/utils'

type AdvertTypeIdParam = {
  id: string
}

type CreateAdvertTypeParams = {
  departmentId: string
  mainTypeId: string
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


type UseAdvertTypesParams = {
  typesParams?: Partial<TypesParams>
  typeId?: string
  onCreateTypeSuccess?: (data: GetAdvertType) => void
  onUpdateTypeSuccess?: (data: GetAdvertType) => void
  onDeleteTypeSuccess?: () => void
}

export const useAdvertTypes = ({
  typesParams,
  typeId,
  onCreateTypeSuccess,
  onUpdateTypeSuccess,
  onDeleteTypeSuccess,
}: UseAdvertTypesParams = {}) => {
  const {
    data: typesData,
    isLoading: isLoadingTypes,
    error: typesError,
    mutate: mutateTypes,
    isValidating: isValidatingTypes,
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
      onError: (error) => {
        toast.error(`Ekki tókst að stofna flokk ${error}`)
      },
      onSuccess: (data) => {
        onCreateTypeSuccess && onCreateTypeSuccess(data)
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

  const createType = (params: CreateAdvertTypeParams) => {
    createTypeTrigger(params)
  }

  const updateType = (params: UpdateTypeParams) => {
    updateTypeTrigger(params)
  }

  const deleteType = (params: AdvertTypeIdParam) => {
    deleteTypeTrigger(params)
  }

  return {
    type: typeData?.type,
    isLoadingType,
    typeError,
    isValidatingTypes,
    refetchType: mutateType,
    types: typesData?.types,
    isLoadingTypes,
    typesError,
    refetchTypes: mutateTypes,
    isCreatingType,
    isUpdatingType,
    isDeletingType,
    createType,
    updateType,
    deleteType,
    createTypeError,
    updateTypeError,
    deleteTypeError,
  }
}
