import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

export type UpdateNextCaseStatusParams = {
  caseId: string
  options?: SWRUpdateNextCaseStatusOptions
}

type SWRUpdateNextCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

export const useUpdateNextCaseStatus = ({
  caseId,
  options,
}: UpdateNextCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<Response, Error, Key, undefined>(
    APIRotues.UpdateNextCaseStatus,
    updateFetcher,
    {
      throwOnError: false,
      ...options,
    },
  )

  return {
    trigger,
    isMutating,
  }
}
