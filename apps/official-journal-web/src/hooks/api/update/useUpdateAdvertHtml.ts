import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
  caseId,
  options,
}: UseUpdateAdvertHtmlParams) => {
  const { trigger, isMutating, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UdpateAdvertHtmlTriggerArgs
  >(
    APIRoutes.UpdateAdvertHtml,
    (url: string, { arg }: { arg: UdpateAdvertHtmlTriggerArgs }) =>
      fetcherV2<Response, UdpateAdvertHtmlTriggerArgs>(
        url.replace(':id', caseId),
        {
          arg: {
            withAuth: true,
            method: 'POST',
            body: arg,
          },
        },
      ),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    error,
    trigger,
    isMutating,
    reset,
  }
}
