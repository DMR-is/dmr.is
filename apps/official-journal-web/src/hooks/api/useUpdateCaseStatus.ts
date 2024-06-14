import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateCaseStatus } from '../../lib/constants'

export type SWRUpdateCaseStatusParams = {
  statusId: string
  caseId: string
}

type SWRUpdateCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRUpdateCaseStatusParams
>

export const useUpdateCaseStatus = (options?: SWRUpdateCaseStatusOptions) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRUpdateCaseStatusParams
  >(APIRotues.UpdateCaseStatus, updateCaseStatus, options)

  return {
    trigger,
    isMutating,
  }
}
