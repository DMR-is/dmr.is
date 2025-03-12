import { useSession } from 'next-auth/react'
import useSWR, { SWRConfiguration } from 'swr'

import { GetDepartmentsResponse } from '../../../gen/fetch'
import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

type SWRDepartmentsOptions = SWRConfiguration<GetDepartmentsResponse, Error>

type UseDepartmentsParams = {
  options?: SWRDepartmentsOptions
  params?: SearchParams
}

export const useDepartments = ({
  options,
  params,
}: UseDepartmentsParams = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.accessToken as string)
  const { data, error, isLoading, mutate, isValidating } = useSWR<
    GetDepartmentsResponse,
    Error
  >(
    session ? ['getDepartments', params] : null,
    ([_key, qsp]: [_key: string, qsp: SearchParams]) =>
      swrFetcher({
        func: () => dmrClient.getDepartments(qsp || {}),
      }),
    {
      revalidateOnFocus: false,
      ...options,
    },
  )

  return {
    departments: data?.departments,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
