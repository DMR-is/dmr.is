import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues as APIRoutes, publishCases } from '../../../lib/constants'

export type SWRAddCommentParams = {
  caseIds: string[]
}

type SWRPublishCasesOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRAddCommentParams
>

export const usePublishCases = (options?: SWRPublishCasesOptions) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    SWRAddCommentParams
  >(APIRoutes.PublishCases, publishCases, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
    error,
  }
}
