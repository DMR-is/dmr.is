import { useState } from 'react'
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
  options?: SWRMainCategoriesOptions
  params?: SearchParams
}

type CreateMainCategoryParams = {
  title: string
  description: string
}

type DeleteMainCategoryParams = {
  id: string
}

export const useMainCategories = ({
  options,
  params,
}: UseMainCategoriesParams = {}) => {
  const [deleteUrl, setDeleteUrl] = useState<string | null>(null)
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
  } = useSWR<GetMainCategoriesResponse, Error>(getUrl, fetcher, options)

  const createUrl = APIRotues.CreateMainCategory

  const { trigger, isMutating: isCreating } = useSWRMutation<
    Response,
    Error,
    Key,
    CreateMainCategoryParams
  >(createUrl, updateFetcher, {
    onSuccess: () => {
      refetchMainCategories()
    },
  })

  const { trigger: deleteTrigger, isMutating: isDeleting } = useSWRMutation<
    Response,
    Error,
    Key,
    DeleteMainCategoryParams
  >(deleteUrl, updateFetcher, {
    onSuccess: () => {
      setDeleteUrl(null)
      refetchMainCategories()
    },
  })

  const deleteMainCategory = (id: string) => {
    setDeleteUrl(APIRotues.DeleteMainCategory.replace(':id', id))
    deleteTrigger({ id })
  }

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: refetchMainCategories,
  }
}
