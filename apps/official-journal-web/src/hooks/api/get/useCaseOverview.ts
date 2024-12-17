import useSWR, { SWRConfiguration } from 'swr'

import {
  EditorialOverviewRequest,
  EditorialOverviewResponse,
} from '../../../gen/fetch'
import { APIRotues, fetcherV2 } from '../../../lib/constants'

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
    [APIRotues.GetEditorialOverview, params],
    ([url, qsp]: [url: string, qsp: CaseEditorialOverviewParams]) => {
      const params = new URLSearchParams()

      Object.entries(qsp).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString())
        }
      })

      return fetcherV2(url, {
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
