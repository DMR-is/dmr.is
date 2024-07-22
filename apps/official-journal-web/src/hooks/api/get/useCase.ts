import useSWR, { SWRConfiguration } from 'swr'

import { GetCaseResponse } from '../../../gen/fetch'
import { APIRotues, fetcher } from '../../../lib/constants'

type UseCaseParams = {
  caseId: string
  options?: SWRConfiguration<GetCaseResponse, Error>
}

export const useCase = ({ caseId, options }: UseCaseParams) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCaseResponse,
    Error
  >(APIRotues.GetCase.replace(':id', caseId), fetcher, options)

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
