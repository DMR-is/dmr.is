import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

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
  >(APIRotues.UpdateAdvertHtml.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    error,
    trigger,
    isMutating,
    reset,
  }
}
