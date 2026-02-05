import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseUpdateSignatureDateDisplayParams = {
  updateCaseSignatureDateDisplayBody: {
    hide: boolean
  }
}

type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UseUpdateSignatureDateDisplayParams
>

type UpdateSignatureDateDisplayParams = {
  options?: Configuration
  caseId: string
}

export const useUpdateSignatureDateDisplay = ({
  options,
  caseId,
}: UpdateSignatureDateDisplayParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    error,
    isMutating,
    trigger: updateSignatureDateDisplay,
  } = swrMutation<Response, Error, Key, UseUpdateSignatureDateDisplayParams>(
    session && caseId
      ? ['updateSignatureDateDisplay', session?.user, caseId]
      : null,
    (_url: any, { arg }: { arg: UseUpdateSignatureDateDisplayParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.updateCaseSignatureDateDisplay({
            id: caseId,
            updateCaseSignatureDateDisplayBody:
              arg.updateCaseSignatureDateDisplayBody,
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
    updateSignatureDateDisplay,
  }
}
