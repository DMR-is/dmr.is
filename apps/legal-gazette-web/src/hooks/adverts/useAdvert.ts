import useSWR from 'swr'

import { GetAdvertByIdRequest } from '../../gen/fetch'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertProps = {
  params?: GetAdvertByIdRequest
}

export const useAdvert = ({ params }: UseAdvertProps = {}) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    params?.id ? ['getAdvertById', params] : null,
    ([_key, params]) => fetcher((client) => client.getAdvertById(params), 'AdvertApi'),
    {
      keepPreviousData: true,
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  return {
    advert: data,
    isLoading,
    error,
    isValidating,
    mutate,
  }
}
