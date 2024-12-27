import useSWR, { SWRConfiguration } from 'swr'

import {
  EditorialOverviewRequest,
  EditorialOverviewResponse,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type SWRCaseOverviewOptions = SWRConfiguration<EditorialOverviewResponse, Error>

export type CaseEditorialOverviewParams = Partial<
  Record<keyof EditorialOverviewRequest, string | number | undefined>
>

type UseCaseOverviewParams = {
  options?: SWRCaseOverviewOptions
  params?: CaseEditorialOverviewParams
}

export const useCaseOverview = ({
  options,
  params,
}: UseCaseOverviewParams = {}) => {
  const {
    data: caseOverviewData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<EditorialOverviewResponse, Error>(
    [APIRoutes.GetEditorialOverview, params],
    ([url, qsp]: [url: string, qsp: CaseEditorialOverviewParams]) => {
      const params = new URLSearchParams()

      Object.entries(qsp).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString())
        }
      })

      return fetcher(url, {
        arg: {
          method: 'GET',
          withAuth: true,
          query: params,
        },
      })
    },
    options,
  )

  return {
    data: caseOverviewData,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
