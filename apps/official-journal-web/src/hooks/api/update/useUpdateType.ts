import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateTypeTriggerArgs = {
  typeId: string
}

type SWRUpdateTypeOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTypeTriggerArgs
>

type UseUpdateTypeParams = {
  options?: SWRUpdateTypeOptions
  caseId: string
}

export const useUpdateType = ({ caseId, options }: UseUpdateTypeParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTypeTriggerArgs
  >(APIRotues.UpdateCaseType.replace(':id', caseId), updateFetcher, {
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
