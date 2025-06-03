import useSWR from 'swr'

import { GetAdvertsInProgressRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

type UseAdvertProps = {
  params?: GetAdvertsInProgressRequest
}

export const useAdvertsInProgress = ({ params = {} }: UseAdvertProps = {}) => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', params],
    ([_key, params]) =>
      swrFetcher({ func: () => client.getAdvertsInProgress(params) }),
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
