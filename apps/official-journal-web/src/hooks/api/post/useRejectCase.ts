import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues as APIRoutes, updateFetcher } from '../../../lib/constants'

type RejectParams = {
  caseId: string
  options?: SWRRejectCaseOptions
}

type SWRRejectCaseOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

export const useRejectCase = ({ caseId, options }: RejectParams) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    undefined
  >(APIRoutes.RejectCase.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
    error,
  }
}
