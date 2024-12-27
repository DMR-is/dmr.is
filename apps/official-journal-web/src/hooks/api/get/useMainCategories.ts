import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'

import { GetMainCategoriesResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'
import { generateParams } from '../../../lib/utils'

type SWRMainCategoriesOptions = SWRConfiguration<
  GetMainCategoriesResponse,
  Error
>

type UseMainCategoriesParams = {
  onCreateMainCategorySuccess?: () => void
  onDeleteMainCategorySuccess?: () => void
  onDeleteMainCategoryCategorySuccess?: () => void
  onCreateMainCategoryCategoriesSuccess?: () => void
  onUpdateMainCategorySuccess?: () => void
  onGetMainCategoriesSuccess?: (data: GetMainCategoriesResponse) => void
  options?: SWRMainCategoriesOptions
  params?: SearchParams
}

type CreateMainCategoryParams = {
  title: string
  description: string
  categories: string[]
}

type UpdateMainCategoryParams = {
  mainCategoryId: string
  title?: string
  description?: string
}

type CreateMainCategoryCategoriesTriggerArgs = {
  mainCategoryId: string
  categoryIds: string[]
}

type DeleteMainCategoryTriggerArgs = {
  mainCategoryId: string
}

type DeleteMainCategoryCategoryTriggerArgs = {
  mainCategoryId: string
  categoryId: string
}

export const useMainCategories = ({
  onDeleteMainCategorySuccess,
  onDeleteMainCategoryCategorySuccess,
  onCreateMainCategorySuccess,
  onCreateMainCategoryCategoriesSuccess,
  onGetMainCategoriesSuccess,
  onUpdateMainCategorySuccess,
  options,
  params,
}: UseMainCategoriesParams = {}) => {
  const {
    data,
    error,
    isLoading,
    isValidating: isFetchingMainCategories,
    mutate: refetchMainCategories,
  } = useSWR<GetMainCategoriesResponse, Error>(
    [APIRoutes.GetMainCategories, params],
    ([url, params]: [url: string, params: SearchParams]) =>
      fetcher(url, {
        arg: {
          method: 'GET',
          query: generateParams(params),
        },
      }),
    {
      ...options,
      onSuccess: (data) => {
        onGetMainCategoriesSuccess && onGetMainCategoriesSuccess(data)
      },
    },
  )

  const { trigger: createMainCategoryTrigger, isMutating: isCreating } =
    useSWRMutation<Response, Error, Key, CreateMainCategoryParams>(
      APIRoutes.CreateMainCategory,
      (url: string, { arg }: { arg: CreateMainCategoryParams }) =>
        fetcher<Response, CreateMainCategoryParams>(url, {
          arg: { method: 'POST', body: arg },
        }),
      {
        throwOnError: false,
        onSuccess: () => {
          refetchMainCategories()
          onCreateMainCategorySuccess && onCreateMainCategorySuccess()
        },
      },
    )

  const {
    trigger: createMainCategoryCategoriesTrigger,
    isMutating: isCreatingMainCategoryCategories,
  } = useSWRMutation<
    Response,
    Error,
    Key,
    CreateMainCategoryCategoriesTriggerArgs
  >(
    APIRoutes.CreateMainCategoryCategories,
    (url: string, { arg }: { arg: CreateMainCategoryCategoriesTriggerArgs }) =>
      fetcher<Response, CreateMainCategoryCategoriesTriggerArgs>(
        url.replace(':id', arg.mainCategoryId),
        {
          arg: { method: 'POST', body: arg },
        },
      ),
    {
      throwOnError: false,
      onSuccess: () => {
        refetchMainCategories()
        onCreateMainCategoryCategoriesSuccess &&
          onCreateMainCategoryCategoriesSuccess()
      },
    },
  )

  const { trigger: deleteMainCategoryTrigger, isMutating: isDeleting } =
    useSWRMutation<Response, Error, Key, DeleteMainCategoryTriggerArgs>(
      APIRoutes.DeleteMainCategory,
      (url: string, { arg }: { arg: DeleteMainCategoryTriggerArgs }) =>
        fetcher<Response>(url.replace(':id', arg.mainCategoryId), {
          arg: {
            method: 'DELETE',
          },
        }),
      {
        throwOnError: false,
        onSuccess: () => {
          refetchMainCategories()
          onDeleteMainCategorySuccess && onDeleteMainCategorySuccess()
        },
      },
    )

  const {
    trigger: deleteMainCategoryCategoryTrigger,
    isMutating: isDeletingMainCategoryCategory,
  } = useSWRMutation<
    Response,
    Error,
    Key,
    DeleteMainCategoryCategoryTriggerArgs
  >(
    APIRoutes.DeleteMainCategoryCategory,
    (url: string, { arg }: { arg: DeleteMainCategoryCategoryTriggerArgs }) =>
      fetcher<Response>(
        url.replace(':id', arg.mainCategoryId).replace(':cid', arg.categoryId),
        { arg: { method: 'DELETE' } },
      ),
    {
      throwOnError: false,
      onSuccess: () => {
        onDeleteMainCategoryCategorySuccess &&
          onDeleteMainCategoryCategorySuccess()
        refetchMainCategories()
      },
    },
  )

  const {
    trigger: updateMainCategoryTrigger,
    isMutating: isUpdatingMainCategory,
  } = useSWRMutation<Response, Error, Key, UpdateMainCategoryParams>(
    APIRoutes.UpdateMainCategory,
    (url: string, { arg }: { arg: UpdateMainCategoryParams }) =>
      fetcher<Response, UpdateMainCategoryParams>(
        url.replace(':id', arg.mainCategoryId),
        {
          arg: { method: 'PUT', body: arg },
        },
      ),
    {
      throwOnError: false,
      onSuccess: () => {
        refetchMainCategories()
        onUpdateMainCategorySuccess && onUpdateMainCategorySuccess()
      },
    },
  )

  const deleteMainCategory = (id: string) => {
    deleteMainCategoryTrigger({ mainCategoryId: id })
  }

  const deleteMainCategoryCategory = (
    mainCategoryId: string,
    categoryId: string,
  ) => {
    deleteMainCategoryCategoryTrigger({
      mainCategoryId,
      categoryId,
    })
  }

  const createMainCategory = (params: CreateMainCategoryParams) => {
    createMainCategoryTrigger(params)
  }

  const createMainCategoryCategories = (
    mainCategoryId: string,
    categoryIds: string[],
  ) => {
    createMainCategoryCategoriesTrigger({
      mainCategoryId,
      categoryIds,
    })
  }

  const updateMainCategory = (params: UpdateMainCategoryParams) => {
    updateMainCategoryTrigger(params)
  }

  return {
    mainCategories: data?.mainCategories,
    error,
    isLoading,
    isDeleting,
    isCreating,
    isFetchingMainCategories,
    isDeletingMainCategoryCategory,
    isCreatingMainCategoryCategories,
    isUpdatingMainCategory,
    deleteMainCategoryCategory,
    refetchMainCategories,
    createMainCategory,
    createMainCategoryCategories,
    deleteMainCategory,
    updateMainCategory,
  }
}
