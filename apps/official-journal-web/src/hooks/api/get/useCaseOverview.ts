import useSWR, { SWRConfiguration } from 'swr'

import { EditorialOverviewResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type SWRCaseOverviewOptions = SWRConfiguration<EditorialOverviewResponse, Error>

type UseCaseOverviewParams = {
  options?: SWRCaseOverviewOptions
  query?: string
}

export const useCaseOverview = ({
  options,
  query,
}: UseCaseOverviewParams = {}) => {
  const url = query
    ? `${APIRotues.GetEditorialOverview}?${query}`
    : APIRotues.GetEditorialOverview
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    EditorialOverviewResponse,
    Error
  >(url, fetcher, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
