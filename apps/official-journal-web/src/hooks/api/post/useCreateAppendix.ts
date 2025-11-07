import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseCreateAppendixParams = {
  createAdvertAppendixBody: {
    content: string
    title: string
  }
}
type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UseCreateAppendixParams
>

type CreateAppendixParams = {
  options?: Configuration
  caseId: string
}

export const useCreateAppendix = ({
  options,
  caseId,
}: CreateAppendixParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    error,
    isMutating,
    trigger: createAppendix,
  } = swrMutation<Response, Error, Key, UseCreateAppendixParams>(
    session && caseId ? ['createAdvertAppendix', session?.user, caseId] : null,
    (_url: any, { arg }: { arg: UseCreateAppendixParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.createAdvertAppendix({
            id: caseId,
            createAdvertAppendixBody: arg.createAdvertAppendixBody,
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
    createAppendix,
  }
}
