import { Key } from 'swr'
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type CreateCategoryParams = {
  title: string
}

type CreateCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  CreateCategoryParams
>

type CreateMainCategoryParams = {
  title: string
  description: string
  categories: string[]
  departmentId: string
}

type CreateMainCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  CreateMainCategoryParams
>

type UpdateMainCategoryParams = {
  mainCategoryId: string
  title?: string
  description?: string
  departmentId?: string
}

type UpdateMainCateogoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateMainCategoryParams
>

type CreateMainCategoryCategoriesTriggerArgs = {
  mainCategoryId: string
  categories: string[]
}

type CreateMainCategoryCategoriesOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  CreateMainCategoryCategoriesTriggerArgs
>

type DeleteMainCategoryTriggerArgs = {
  mainCategoryId: string
}

type DeleteMainCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  DeleteMainCategoryTriggerArgs
>

type DeleteMainCategoryCategoryTriggerArgs = {
  mainCategoryId: string
  categoryId: string
}

type DeleteMainCategoryCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  DeleteMainCategoryCategoryTriggerArgs
>

type UseUpdateMainCategoriesParams = {
  createCategoryOptions?: CreateCategoryOptions
  createMainCategoryOptions?: CreateMainCategoryOptions
  updateMainCategoryOptions?: UpdateMainCateogoryOptions
  createMainCategoryCategoriesOptions?: CreateMainCategoryCategoriesOptions
  deleteMainCategoryOptions?: DeleteMainCategoryOptions
  deleteMainCategoryCategoryOptions?: DeleteMainCategoryCategoryOptions
}

export const useUpdateMainCategories = ({
  createCategoryOptions,
  createMainCategoryOptions,
  updateMainCategoryOptions,
  createMainCategoryCategoriesOptions,
  deleteMainCategoryCategoryOptions,
  deleteMainCategoryOptions,
}: UseUpdateMainCategoriesParams = {}) => {
  const { trigger: createCategoryTrigger, isMutating: isCreatingCategory } =
    useSWRMutation<Response, Error, Key, CreateCategoryParams>(
      APIRoutes.Categories,
      (url: string, { arg }: { arg: CreateCategoryParams }) =>
        fetcher<Response, CreateCategoryParams>(url, {
          arg: { method: 'POST', body: arg },
        }),
      {
        throwOnError: false,
        ...createCategoryOptions,
      },
    )

  const {
    trigger: createMainCategoryTrigger,
    isMutating: isCreatingMainCategory,
  } = useSWRMutation<Response, Error, Key, CreateMainCategoryParams>(
    APIRoutes.MainCategories,
    (url: string, { arg }: { arg: CreateMainCategoryParams }) =>
      fetcher<Response, CreateMainCategoryParams>(url, {
        arg: { method: 'POST', body: arg },
      }),
    {
      throwOnError: false,
      ...createMainCategoryOptions,
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
    APIRoutes.MainCategoryCategories,
    (url: string, { arg }: { arg: CreateMainCategoryCategoriesTriggerArgs }) =>
      fetcher<Response, CreateMainCategoryCategoriesTriggerArgs>(
        url.replace(':id', arg.mainCategoryId),
        {
          arg: { method: 'POST', body: arg },
        },
      ),
    {
      throwOnError: false,
      ...createMainCategoryCategoriesOptions,
    },
  )

  const {
    trigger: deleteMainCategoryTrigger,
    isMutating: isDeletingMainCategory,
  } = useSWRMutation<Response, Error, Key, DeleteMainCategoryTriggerArgs>(
    APIRoutes.MainCategory,
    (url: string, { arg }: { arg: DeleteMainCategoryTriggerArgs }) =>
      fetcher<Response>(url.replace(':id', arg.mainCategoryId), {
        arg: {
          method: 'DELETE',
        },
      }),
    {
      throwOnError: false,
      ...deleteMainCategoryOptions,
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
    APIRoutes.MainCategoryCategory,
    (url: string, { arg }: { arg: DeleteMainCategoryCategoryTriggerArgs }) =>
      fetcher<Response>(
        url.replace(':id', arg.mainCategoryId).replace(':cid', arg.categoryId),
        { arg: { method: 'DELETE' } },
      ),
    {
      throwOnError: false,
      ...deleteMainCategoryCategoryOptions,
    },
  )

  const {
    trigger: updateMainCategoryTrigger,
    isMutating: isUpdatingMainCategory,
  } = useSWRMutation<Response, Error, Key, UpdateMainCategoryParams>(
    APIRoutes.MainCategory,
    (url: string, { arg }: { arg: UpdateMainCategoryParams }) =>
      fetcher<Response, UpdateMainCategoryParams>(
        url.replace(':id', arg.mainCategoryId),
        {
          arg: {
            method: 'PUT',
            body: {
              mainCategoryId: arg.mainCategoryId,
              description: arg.description,
              title: arg.title,
            },
          },
        },
      ),
    {
      throwOnError: false,
      ...updateMainCategoryOptions,
    },
  )

  return {
    isCreatingCategory,
    isDeletingMainCategory,
    isCreatingMainCategory,
    isDeletingMainCategoryCategory,
    isCreatingMainCategoryCategories,
    isUpdatingMainCategory,
    createCategoryTrigger,
    deleteMainCategoryCategoryTrigger,
    createMainCategoryTrigger,
    createMainCategoryCategoriesTrigger,
    deleteMainCategoryTrigger,
    updateMainCategoryTrigger,
  }
}
