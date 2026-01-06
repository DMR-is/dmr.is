import { useSession } from 'next-auth/react'

import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { getDmrClient } from '../../../lib/api/createClient'
import { swrFetcher } from '../../../lib/constants'

type UdpateAdvertHtmlTriggerArgs = {
  advertHtml: string
}

type SWRUpdateAdvertHtmlOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UdpateAdvertHtmlTriggerArgs
>

type UseUpdateAdvertHtmlParams = {
  options?: SWRUpdateAdvertHtmlOptions
  caseId: string
}

export const useUpdateAdvertHtml = ({
  options,
  caseId,
}: UseUpdateAdvertHtmlParams) => {
  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const { data, error, isMutating, trigger } = swrMutation<
    Response,
    Error,
    Key,
    UdpateAdvertHtmlTriggerArgs
  >(
    session && caseId ? ['useUpdateAdvertHtml', session?.user, caseId] : null,
    (_url: any, { arg }: { arg: UdpateAdvertHtmlTriggerArgs }) =>
      swrFetcher({
        func: () =>
          dmrClient.updateAdvertHtml({
            id: caseId,
            updateAdvertHtmlBody: {
              advertHtml: arg.advertHtml,
            },
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
    trigger,
  }
}
