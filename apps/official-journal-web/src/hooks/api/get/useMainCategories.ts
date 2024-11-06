import useSWR, { Key, SWRConfiguration } from 'swr'
import useSWRMutation from 'swr/mutation'

import { GetMainCategoriesResponse } from '../../../gen/fetch'
import { APIRotues, fetcher, updateFetcher } from '../../../lib/constants'
import { generateQueryFromParams, SearchParams } from '../../../lib/types'

type SWRMainCategoriesOptions = SWRConfiguration<
  GetMainCategoriesResponse,
  Error
>

type UseMainCategoriesParams = {
  onCreateMainCategorySuccess?: () => void
  onDeleteMainCategorySuccess?: () => void
  onDeleteMainCategoryCategorySuccess?: () => void
  onCreateMainCategoryCategoriesSuccess?: () => void
  onGetMainCategoriesSuccess?: (data: GetMainCategoriesResponse) => void
  options?: SWRMainCategoriesOptions
  params?: SearchParams
}

type CreateMainCategoryParams = {
  title: string
  description: string
  categories: string[]
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
  options,
  params,
}: UseMainCategoriesParams = {}) => {
  const getQuery = generateQueryFromParams(params)
  const getUrl = getQuery
    ? `${APIRotues.GetMainCategories}?${getQuery}`
    : APIRotues.GetMainCategories
  const {
    data,
    error,
    isLoading,
    mutate: refetchMainCategories,
    isValidating,
  } = useSWR<GetMainCategoriesResponse, Error>(getUrl, fetcher, {
    ...options,
    onSuccess: (data) => {
      onGetMainCategoriesSuccess && onGetMainCategoriesSuccess(data)
    },
  })

  const { trigger: createMainCategoryTrigger, isMutating: isCreating } =
    useSWRMutation<Response, Error, Key, CreateMainCategoryParams>(
      APIRotues.CreateMainCategory,
      updateFetcher,
      {
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
    APIRotues.CreateMainCategoryCategories,
    (
      url: string,
      { arg }: { arg: { mainCategoryId: string; categoryIds: string[] } },
    ) =>
      updateFetcher(url.replace(':id', arg.mainCategoryId), {
        arg: { method: 'POST', categoryIds: arg.categoryIds },
      }),
    {
      onSuccess: () => {
        refetchMainCategories()
        onCreateMainCategoryCategoriesSuccess &&
          onCreateMainCategoryCategoriesSuccess()
      },
    },
  )

  const { trigger: deleteMainCategoryTrigger, isMutating: isDeleting } =
    useSWRMutation<Response, Error, Key, DeleteMainCategoryTriggerArgs>(
      APIRotues.DeleteMainCategory,
      (url: string) => fetcher(url, { arg: { method: 'DELETE' } }),
      {
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
    APIRotues.DeleteMainCategoryCategory,
    (
      url: string,
      { arg }: { arg: { mainCategoryId: string; categoryId: string } },
    ) =>
      fetcher(
        url.replace(':id', arg.mainCategoryId).replace(':cid', arg.categoryId),
        { arg: { method: 'DELETE' } },
      ),
    {
      onSuccess: () => {
        onDeleteMainCategoryCategorySuccess &&
          onDeleteMainCategoryCategorySuccess()
        refetchMainCategories()
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

  return {
    mainCategories: data?.mainCategories,
    error,
    isLoading,
    isDeleting,
    isCreating,
    isValidating,
    isDeletingMainCategoryCategory,
    isCreatingMainCategoryCategories,
    deleteMainCategoryCategory,
    refetchMainCategories,
    createMainCategory,
    createMainCategoryCategories,
    deleteMainCategory,
  }
}
