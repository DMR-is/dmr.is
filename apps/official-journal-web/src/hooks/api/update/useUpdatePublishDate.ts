import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdatePublishDateTriggerArgs = {
  date: string
}

type SWRUpdatePublishDateOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePublishDateTriggerArgs
>

type UseUpdatePublishDateParams = {
  options?: SWRUpdatePublishDateOptions
  caseId: string
}
export const useUpdatePublishDate = ({
  caseId,
  options,
}: UseUpdatePublishDateParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePublishDateTriggerArgs
  >(APIRotues.UpdatePublishDate.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    data,
    error,
    trigger,
    isMutating,
    reset,
  }
}
