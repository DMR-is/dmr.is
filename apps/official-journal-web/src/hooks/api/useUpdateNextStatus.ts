import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateNextCaseStatus } from '../../lib/constants'

export type SWRUpdateNextCaseStatusParams = {
  caseId: string
}

type SWRUpdateNextCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRUpdateNextCaseStatusParams
>

export const useUpdateNextCaseStatus = (
  options?: SWRUpdateNextCaseStatusOptions,
) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRUpdateNextCaseStatusParams
  >(APIRotues.UpdateNextCaseStatus, updateNextCaseStatus, options)

  return {
    trigger,
    isMutating,
  }
}
