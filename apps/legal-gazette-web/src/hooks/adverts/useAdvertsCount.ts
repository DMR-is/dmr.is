import useSWR from 'swr'

import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

export const useAdvertsCount = () => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdvert'],
    ([_key]) => swrFetcher({ func: () => client.getAdvertsCount() }),
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
