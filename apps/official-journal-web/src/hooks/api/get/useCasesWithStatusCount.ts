import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import {
  GetCasesWithStatusCount,
  GetCasesWithStatusCountRequest,
} from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'
import { NullableExcept } from '../../../lib/types'
import { getParamsWithoutNullOrEmpty } from '../../../lib/utils'

type UseGetCasesWithStatusCount = {
  params?: NullableExcept<GetCasesWithStatusCountRequest, 'status'>
}

export const useCasesWithStatusCount = ({
  params,
}: UseGetCasesWithStatusCount = {}) => {
  const { data: session } = useSession()

  const dmrClient = getDmrClient(session?.idToken as string)
  const castedParams: { [key: string]: unknown } = params ? params : {}
  const paramsWithoutNull = getParamsWithoutNullOrEmpty(castedParams)

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<GetCasesWithStatusCount>(
      session
        ? ['getCasesWithStatusCount', session?.user, paramsWithoutNull]
        : null,
      ([_key, _user, qsp]: [
        _key: unknown,
        _user: unknown,
        qsp: GetCasesWithStatusCountRequest,
      ]) =>
        swrFetcher({
          func: () => dmrClient.getCasesWithStatusCount(qsp),
        }),
      {
        refreshInterval: 1000 * 60 * 5,
        keepPreviousData: true,
        revalidateOnFocus: false,
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
