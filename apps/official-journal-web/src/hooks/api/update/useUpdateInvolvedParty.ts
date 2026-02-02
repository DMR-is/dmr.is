import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UseUpdateInvolvedPartyParams = {
  updateInvolvedPartyBody: {
    involvedPartyId: string
  }
}

type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UseUpdateInvolvedPartyParams
>

type UpdateInvolvedPartyParams = {
  options?: Configuration
  caseId: string
}

export const useUpdateInvolvedParty = ({
  options,
  caseId,
}: UpdateInvolvedPartyParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    error,
    isMutating,
    trigger: updateInvolvedParty,
  } = swrMutation<Response, Error, Key, UseUpdateInvolvedPartyParams>(
    session && caseId ? ['updateInvolvedParty', session?.user, caseId] : null,
    (_url: any, { arg }: { arg: UseUpdateInvolvedPartyParams }) =>
      swrFetcher({
        func: () =>
          dmrClient.updateSingleCaseInvolvedParty({
            id: caseId,
            updateCaseInvolvedPartyBody: arg.updateInvolvedPartyBody,
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
    updateInvolvedParty,
  }
}
