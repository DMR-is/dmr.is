import useSWR from 'swr'

import { EditorialOverviewRequest, GetCasesOverview } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'
import { generateParams } from '../../../lib/utils'

type UseCaseOverviewParams = {
  params?: Partial<EditorialOverviewRequest>
}

export const useCaseOverview = ({ params }: UseCaseOverviewParams = {}) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCasesOverview,
    Error
  >(
    [APIRoutes.GetEditorialOverview, params],
    ([url, qsp]: [url: string, qsp: EditorialOverviewRequest]) => {
      return fetcher(url, {
        arg: {
          method: 'GET',
          withAuth: true,
          query: generateParams(qsp),
        },
      })
    },
    {
      refreshInterval: 1000 * 60 * 5,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  return {
    cases: data?.cases,
    paging: data?.paging,
    statuses: data?.statuses,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
