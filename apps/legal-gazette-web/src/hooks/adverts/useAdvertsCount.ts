import useSWR from 'swr'

import { getLegalGazetteClient } from '../../lib/api/createClient'
import { fetcher } from '../../lib/api/fetchers'

export const useAdvertsCount = () => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdvert'],
    ([_key]) => fetcher({ func: () => client.getAdvertsCount() }),
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
