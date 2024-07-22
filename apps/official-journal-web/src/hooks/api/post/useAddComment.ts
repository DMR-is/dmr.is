import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type SWRAddCommentParams = {
  caseId: string
  internal: boolean
  comment: string
  from: string
  to?: string
}

import { APIRotues as APIRoutes, updateFetcher } from '../../../lib/constants'

type SWRAddCommentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRAddCommentParams
>

type UseAddCommentParams = {
  caseId: string
  options?: SWRAddCommentOptions
}

export const useAddComment = ({ caseId, options }: UseAddCommentParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRAddCommentParams
  >(APIRoutes.CreateComment.replace(':id', caseId), updateFetcher, options)

  return {
    trigger,
    isMutating,
  }
}
