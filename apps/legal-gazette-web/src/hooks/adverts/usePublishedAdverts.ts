import useSWR from 'swr'

import { GetAdvertsRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

type UseAdvertProps = {
  query?: GetAdvertsRequest
}

export const usePublishedAdverts = ({ query = {} }: UseAdvertProps = {}) => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', query],
    ([_key, q]) => swrFetcher({ func: () => client.getAdverts(q) }),
    {
      keepPreviousData: true,
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  return {
    adverts: data?.adverts ?? [],
    paging: data?.paging,
    isLoading,
    error,
    isValidating,
    mutate,
  }
}
