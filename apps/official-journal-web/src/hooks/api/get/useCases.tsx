import { useSession } from 'next-auth/react'

import useSWR, { SWRConfiguration } from 'swr'

import { GetCasesReponse, GetCasesRequest } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { APIRoutes, swrFetcher } from '../../../lib/constants'
import { NullableExcept } from '../../../lib/types'
import { getParamsWithoutNullOrEmpty } from '../../../lib/utils'

type SWRCasesOptions = SWRConfiguration<GetCasesReponse, Error>

type UseCasesParams = {
  shouldFetch?: boolean
  options?: SWRCasesOptions
  params?: NullableExcept<GetCasesRequest, 'status'>
}

export const useCases = ({ options, params }: UseCasesParams = {}) => {
  const { data: session } = useSession()

  const dmrClient = getDmrClient(session?.idToken as string)
  const castedParams: { [key: string]: unknown } = params ? params : {}
  const paramsWithoutNull = getParamsWithoutNullOrEmpty(castedParams)
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetCasesReponse,
    Error
  >(
    session ? [APIRoutes.GetCases, paramsWithoutNull] : null,
    ([_key, params]: [key: unknown, params: GetCasesRequest]) =>
      swrFetcher({
        func: () => dmrClient.getCases(params),
      }),
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
