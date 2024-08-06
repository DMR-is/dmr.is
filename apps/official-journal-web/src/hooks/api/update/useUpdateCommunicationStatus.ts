import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateCommunicationStatusTriggerArgs = {
  statusId: string
}

type SWRUpdateCommunicationStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateCommunicationStatusTriggerArgs
>

type UseUpdateCommunicationStatusParams = {
  options?: SWRUpdateCommunicationStatusOptions
  caseId: string
}

export const useUpdateCommunicationStatus = ({
  caseId,
  options,
}: UseUpdateCommunicationStatusParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateCommunicationStatusTriggerArgs
  >(APIRotues.UpdateCommunicationStatus.replace(':id', caseId), updateFetcher, {
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
