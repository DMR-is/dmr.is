import useSWR from 'swr'

import { GetAdvertsRequest } from '../../gen/fetch'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertProps = {
  query?: GetAdvertsRequest
}

export const usePublishedAdverts = ({ query = {} }: UseAdvertProps = {}) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', query],
    ([_key, q]) => fetcher((client) => client.getAdverts(q), 'AdvertApi'),
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
