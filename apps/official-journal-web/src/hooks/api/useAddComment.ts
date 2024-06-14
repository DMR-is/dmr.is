import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type SWRAddCommentParams = {
  caseId: string
  internal: boolean
  comment: string
  from: string
  to?: string
}

import { APIRotues as APIRoutes, createComment } from '../../lib/constants'

type SWRAddCommentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRAddCommentParams
>

export const useAddComment = (options?: SWRAddCommentOptions) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRAddCommentParams
  >(APIRoutes.CreateComment, createComment, options)

  return {
    trigger,
    isMutating,
  }
}
