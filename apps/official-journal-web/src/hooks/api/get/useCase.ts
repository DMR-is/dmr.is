import useSWR, { SWRConfiguration } from 'swr'

import { GetCaseResponse } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UseCaseParams = {
  caseId: string
  options?: SWRConfiguration<GetCaseResponse, Error>
}

export const useCase = ({ caseId, options }: UseCaseParams) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    GetCaseResponse,
    Error
  >(
    caseId ? [APIRoutes.GetCase, caseId] : null,
    ([url, id]: [url: string, id: string]) =>
      fetcher(url.replace(':id', id), {
        arg: { withAuth: true, method: 'GET' },
      }),
    options,
  )

  return {
    case: data?._case,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
