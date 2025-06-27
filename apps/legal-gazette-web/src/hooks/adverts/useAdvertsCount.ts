import useSWR from 'swr'

import { fetcher } from '../../lib/api/fetchers'

export const useAdvertsCount = () => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdvert'],
    ([_key]) =>
      fetcher(
        (client) => client.getAdvertsCount(),
        'AdvertApi',
      ),
    {
      keepPreviousData: true,
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  return {
    statuses: data,
    isLoading,
    error,
    isValidating,
    mutate,
  }
}
