import useSWR from 'swr'

import { GetCasesRequest } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

type UseCasesParams = {
  caseId?: string
  query?: GetCasesRequest
}

export const useCases = ({ caseId, query = {} }: UseCasesParams = {}) => {
  const client = getLegalGazetteClient('CaseApi', 'todo:add-token')

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    caseId ? ['getCase', caseId] : null,
    ([_key, id]) => client.getCase({ id }),
  )

  const {
    data: cases,
    error: casesError,
    isLoading: casesLoading,
  } = useSWR(
    ['getCases', query],
    ([_key, q]) => swrFetcher({ func: () => client.getCases(q) }),
    {
      keepPreviousData: true,
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  return {
    case: data,
    cases: cases?.cases ?? [],
    paging: cases?.paging,
    error: error || casesError,
    isLoading: isLoading || casesLoading,
    isValidating,
    mutateCase: mutate,
  }
}
