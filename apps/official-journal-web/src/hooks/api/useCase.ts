import useSWR, { BareFetcher, SWRConfiguration } from 'swr'

import { GetCaseResponse } from '../../gen/fetch'
import { APIRotues, getCase } from '../../lib/constants'

type Props = {
  caseId: string
  options?: SWRConfiguration<
    GetCaseResponse,
    Error,
    BareFetcher<GetCaseResponse>
  >
}

export const useCase = ({ caseId, options }: Props) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCaseResponse,
    Error
  >(APIRotues.Case.replace(':id', caseId), getCase, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
