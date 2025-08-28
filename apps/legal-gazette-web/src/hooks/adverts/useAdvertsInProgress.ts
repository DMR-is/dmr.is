import useSWR from 'swr'

import { GetAdvertsInProgressRequest } from '../../gen/fetch'
import { fetcher } from '../../lib/api/fetchers'

type UseAdvertProps = {
  params?: GetAdvertsInProgressRequest
}

export const useAdvertsInProgress = ({ params = {} }: UseAdvertProps = {}) => {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ['getAdverts', params],
    ([_key, params]) =>
      fetcher((client) => client.getAdvertsInProgress(params), 'AdvertApi'),
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
