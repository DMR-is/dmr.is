import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdatePreviousCaseStatusTriggerArgs = {
  currentStatus: string
}

export type UpdatePreviousCaseStatusParams = {
  caseId: string
  options?: SWRUpdatePreviousCaseStatusOptions
}

type SWRUpdatePreviousCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePreviousCaseStatusTriggerArgs
>

export const useUpdatePreviousCaseStatus = ({
  caseId,
  options,
}: UpdatePreviousCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePreviousCaseStatusTriggerArgs
  >(APIRotues.UpdatePreviousCaseStatus.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
  }
}
