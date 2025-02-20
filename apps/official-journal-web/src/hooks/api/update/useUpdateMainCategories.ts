import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type CreateMainCategoryParams = {
  title: string
  description: string
  categories: string[]
  departmentId: string
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

export const useUpdateMainCategories = () => {
  const { trigger: createMainCategoryTrigger, isMutating: isCreating } =
    useSWRMutation<Response, Error, Key, CreateMainCategoryParams>(
      APIRoutes.CreateMainCategory,
      (url: string, { arg }: { arg: CreateMainCategoryParams }) =>
        fetcher<Response, CreateMainCategoryParams>(url, {
          arg: { method: 'POST', body: arg },
        }),
      {
        throwOnError: false,
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
    isDeleting,
    isCreating,
    isDeletingMainCategoryCategory,
    isCreatingMainCategoryCategories,
    isUpdatingMainCategory,
    deleteMainCategoryCategory,
    createMainCategory,
    createMainCategoryCategories,
    deleteMainCategory,
    updateMainCategory,
  }
}
