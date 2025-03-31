import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetCategoriesResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

type SWRCategoriesOptions = SWRConfiguration<GetCategoriesResponse, Error>

type UseCategoriesParams = {
  options?: SWRCategoriesOptions
  params?: SearchParams
}

export const useCategories = ({
  options,
  params,
}: UseCategoriesParams = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string)
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCategoriesResponse,
    Error
  >(
    session ? ['getCategories', params] : null,
    ([_key, qsp]: [_key: string, qsp: SearchParams]) =>
      swrFetcher({
        func: () => dmrClient.getCategories(qsp),
      }),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      ...options,
    },
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
