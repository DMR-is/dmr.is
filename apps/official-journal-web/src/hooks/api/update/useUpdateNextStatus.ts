import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateNextCaseStatusTriggerArgs = {
  currentStatus: string
}

export type UpdateNextCaseStatusParams = {
  caseId: string
  options?: SWRUpdateNextCaseStatusOptions
}

type SWRUpdateNextCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateNextCaseStatusTriggerArgs
>

export const useUpdateNextCaseStatus = ({
  caseId,
  options,
}: UpdateNextCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateNextCaseStatusTriggerArgs
  >(APIRotues.UpdateNextCaseStatus.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
  }
}
