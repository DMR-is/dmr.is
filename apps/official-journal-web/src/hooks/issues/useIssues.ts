import { useSession } from 'next-auth/react'

import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@island.is/island-ui/core'

import {
  GenerateMonthlyIssuesRequest,
  GetMonthlyIssuesRequest,
} from '../../gen/fetch'
import { getDmrClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/constants'

type UseIssuesProps = {
  params?: GetMonthlyIssuesRequest
}

export const useIssues = ({ params = {} }: UseIssuesProps = {}) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isLoading, mutate } = useSWR(
    session ? ['getIssues', session.user, params] : null,
    ([_key, _user, params]) =>
      swrFetcher({
        func: () => dmrClient.getMonthlyIssues(params),
      }),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  const { trigger: generateIssues, isMutating } = useSWRMutation<
    void,
    Error,
    Key,
    GenerateMonthlyIssuesRequest
  >(
    session ? ['generateIssues', session.user] : null,
    (_key: string, { arg }: { arg: GenerateMonthlyIssuesRequest }) =>
      swrFetcher({
        func: () => dmrClient.generateMonthlyIssues(arg),
      }),
    {
      onSuccess: () => {
        toast.success('Hefti búið til')
        mutate()
      },
      onError: (_error) => {
        toast.error('Ekki tókst að búa til hefti')
      },
    },
  )

  return {
    issues: data,
    error,
    isLoading,
    generateIssues,
    isGenerating: isMutating,
  }
}
