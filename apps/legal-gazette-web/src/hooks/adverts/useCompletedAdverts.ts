import useSWR from 'swr'

import { GetCompletedAdvertsRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertProps = {
  query?: GetCompletedAdvertsRequest
}

export const useCompletedAdverts = ({ query = {} }: UseAdvertProps = {}) => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', query],
    ([_key, q]) => fetcher({ func: () => client.getCompletedAdverts(q) }),
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
