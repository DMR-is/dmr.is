import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseDeleteAppendixParams = {
  deleteAdvertAppendixBody: {
    additionId: string
  }
}

type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UseDeleteAppendixParams
>

type DeleteAppendixParams = {
  options?: Configuration
  caseId: string
}

export const useDeleteAppendix = ({
  options,
  caseId,
}: DeleteAppendixParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    error,
    isMutating,
    trigger: deleteAppendix,
  } = swrMutation<Response, Error, Key, UseDeleteAppendixParams>(
    session && caseId ? ['deleteAdvertAppendix', session?.user, caseId] : null,
    (_url: any, { arg }: { arg: UseDeleteAppendixParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.deleteAdvertAppendix({
            id: caseId,
            deleteAdvertAppendixBody: arg.deleteAdvertAppendixBody,
          }),
      }) as unknown as Promise<Response>,
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    data,
    error,
    isMutating,
    deleteAppendix,
  }
}
