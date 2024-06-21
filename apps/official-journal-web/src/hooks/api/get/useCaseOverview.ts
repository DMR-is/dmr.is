import useSWR, { SWRConfiguration } from 'swr'

import { EditorialOverviewResponse } from '../../../gen/fetch'
import { APIRotues, fetchWithQueryString } from '../../../lib/constants'

type SWRCaseOverviewOptions = SWRConfiguration<EditorialOverviewResponse, Error>

type UseCaseOverviewParams = {
  options?: SWRCaseOverviewOptions
  qsp?: string
}

export const useCaseOverview = ({
  options,
  qsp,
}: UseCaseOverviewParams = {}) => {
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    EditorialOverviewResponse,
    Error
  >(
    [APIRotues.EditorialOverview, qsp],
    ([url, qsp]: [string, string | undefined]) =>
      fetchWithQueryString(url, qsp),
    options,
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
