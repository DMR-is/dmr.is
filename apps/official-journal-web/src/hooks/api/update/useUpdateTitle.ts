import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateTitleTriggerArgs = {
  title: string
}

type SWRUpdateTitleOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTitleTriggerArgs
>

type UseUpdateTitleParams = {
  options?: SWRUpdateTitleOptions
  caseId: string
}
export const useUpdateTitle = ({ caseId, options }: UseUpdateTitleParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTitleTriggerArgs
  >(APIRotues.UpdateTitle.replace(':id', caseId), updateFetcher, {
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
