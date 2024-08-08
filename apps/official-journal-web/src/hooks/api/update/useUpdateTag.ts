import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateTagTriggerArgs = {
  tagId: string
}

type SWRUpdateTagOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTagTriggerArgs
>

type UseUpdateTagParams = {
  options?: SWRUpdateTagOptions
  caseId: string
}

export const useUpdateTag = ({ caseId, options }: UseUpdateTagParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTagTriggerArgs
  >(APIRotues.UpdateTag.replace(':id', caseId), updateFetcher, {
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
