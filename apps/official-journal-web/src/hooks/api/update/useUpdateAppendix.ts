import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseUpdateAppendixParams = {
  updateAdvertAppendixBody: {
    content: string | null
    title: string | null
    additionId: string
    order: string | null
  }
}

type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UseUpdateAppendixParams
>

type UpdateAppendixParams = {
  options?: Configuration
  caseId: string
}

export const useUpdateAppendix = ({
  options,
  caseId,
}: UpdateAppendixParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    error,
    isMutating,
    trigger: updateAdAppendix,
  } = swrMutation<Response, Error, Key, UseUpdateAppendixParams>(
    session && caseId ? ['updateAdvertAppendix', session?.user, caseId] : null,
    (_url: any, { arg }: { arg: UseUpdateAppendixParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.updateAdvertAppendix({
            id: caseId,
            updateAdvertAppendixBody: arg.updateAdvertAppendixBody,
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
    updateAdAppendix,
  }
}
