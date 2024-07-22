import useSWR, { SWRConfiguration } from 'swr'

import { EditorialOverviewResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'
import {
  CaseOverviewSearchParams,
  generateQueryFromParams,
} from '../../../lib/types'

type SWRCaseOverviewOptions = SWRConfiguration<EditorialOverviewResponse, Error>

type UseCaseOverviewParams = {
  options?: SWRCaseOverviewOptions
  params?: CaseOverviewSearchParams
}

export const useCaseOverview = ({
  options,
  params,
}: UseCaseOverviewParams = {}) => {
  const query = generateQueryFromParams(params)
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
