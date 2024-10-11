import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues as APIRoutes, updateFetcher } from '../../../lib/constants'

type UnpublishParams = {
  caseId: string
  options?: SWRUnpublishCaseOptions
}

type SWRUnpublishCaseOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

export const useUnpublishCase = ({ caseId, options }: UnpublishParams) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    undefined
  >(APIRoutes.UnpublishCase.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
    error,
  }
}
