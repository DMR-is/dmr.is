import useSWR from 'swr'

import { GetCategoriesRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

type UseAdvertCategoriesParams = {
  query?: GetCategoriesRequest
}

export const useAdvertCategories = ({
  query = {},
}: UseAdvertCategoriesParams) => {
  const client = getLegalGazetteClient('AdvertCategoryApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getCategories', query],
    ([_key, q]) =>
      swrFetcher({
        func: () => client.getCategories(q),
      }),
  )

  const categoryOptions = data?.categories.map((category) => ({
    value: category.id,
    label: category.title,
  }))

  return {
    categories: data?.categories || [],
    categoryOptions: categoryOptions || [],
    isLoading,
    error,
    isValidating,
    mutate,
  }
}
