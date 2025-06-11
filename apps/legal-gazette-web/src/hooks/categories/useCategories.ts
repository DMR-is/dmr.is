import useSWR from 'swr'

import { GetCategoriesRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertCategoriesParams = {
  query?: GetCategoriesRequest
}

export const useCategories = ({ query = {} }: UseAdvertCategoriesParams) => {
  const client = getLegalGazetteClient('CategoryApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getCategories', query],
    ([_key, q]) =>
      fetcher({
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
