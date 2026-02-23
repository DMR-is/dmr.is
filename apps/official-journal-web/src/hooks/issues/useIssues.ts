import { useSession } from 'next-auth/react'

import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

import { toast } from '@island.is/island-ui/core'

import { GetMonthlyIssuesRequest } from '../../gen/fetch'
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
  )

  const { trigger: generateIssues } = useSWRMutation(
    session ? ['generateIssues', session.user] : null,
    ([_key, _user], { arg }) =>
      swrFetcher({
        func: () => dmrClient.generateMonthlyIssues(arg),
      }),
    {
      onSuccess: () => {
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
  }
}
