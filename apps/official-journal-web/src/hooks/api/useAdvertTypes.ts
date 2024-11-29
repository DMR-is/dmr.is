import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { GetAdvertMainType, GetAdvertType } from '../../gen/fetch'
import {
  APIRotues,
  fetcher,
  OJOIWebException,
  updateFetcher,
} from '../../lib/constants'

type AdvertTypeIdParam = {
  id: string
}

type CreateAdvertTypeParams = {
  departmentId: string
  mainTypeId: string
  title: string
}

type UpdateTypeParams = {
  id: string
  title: string
}

type CreateAdvertMainTypeParams = Omit<CreateAdvertTypeParams, 'mainTypeId'>

type UseAdvertTypesParams = {
  onCreateTypeSuccess?: (data: GetAdvertType) => void
  onCreateMainTypeSuccess?: (data: GetAdvertMainType) => void
  onUpdateTypeSuccess?: (data: GetAdvertType) => void
  onUpdateMainTypeSuccess?: (datA: GetAdvertMainType) => void
  onDeleteTypeSuccess?: () => void
  onDeleteMainTypeSuccess?: () => void
}

export const useAdvertTypes = ({
  onCreateMainTypeSuccess,
  onCreateTypeSuccess,
  onUpdateMainTypeSuccess,
  onUpdateTypeSuccess,
  onDeleteMainTypeSuccess,
  onDeleteTypeSuccess,
}: UseAdvertTypesParams = {}) => {
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
        arg: { method: 'PUT', title: arg.title, id: arg.id },
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
