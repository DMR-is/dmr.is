import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

export type UpdateCaseStatusParams = {
  caseId: string
  options?: SWRUpdateCaseStatusOptions
}

type UpdateCaseStatusTriggerArgs = {
  statusId: string
}

type SWRUpdateCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateCaseStatusTriggerArgs
>

export const useUpdateCaseStatus = ({
  caseId,
  options,
}: UpdateCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateCaseStatusTriggerArgs
  >(APIRotues.UpdateCaseStatus.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
  }
}
