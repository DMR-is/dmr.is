import useSWR from 'swr'

import { GetAdvertByIdRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

type UseAdvertProps = {
  params?: GetAdvertByIdRequest
}

export const useAdvert = ({ params }: UseAdvertProps = {}) => {
  const client = getLegalGazetteClient('AdvertApi', 'todo:add-token')

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    params?.id ? ['getAdvertById', params] : null,
    ([_key, params]) =>
      swrFetcher({ func: () => client.getAdvertById(params) }),
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
