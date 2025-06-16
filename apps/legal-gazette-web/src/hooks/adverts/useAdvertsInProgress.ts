import useSWR from 'swr'

import { GetAdvertsInProgressRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertProps = {
  params?: GetAdvertsInProgressRequest
}

export const useAdvertsInProgress = ({ params = {} }: UseAdvertProps = {}) => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', params],
    ([_key, params]) =>
      fetcher({ func: () => client.getAdvertsInProgress(params) }),
    {
      keepPreviousData: true,
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
