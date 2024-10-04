import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type AddCommentTriggerArgs = {
  caseId: string
  internal: boolean
  comment: string
  creator: string
  receiver?: string
}

import { APIRotues as APIRoutes, updateFetcher } from '../../../lib/constants'

type SWRAddCommentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  AddCommentTriggerArgs
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
    AddCommentTriggerArgs
  >(APIRoutes.CreateComment.replace(':id', caseId), updateFetcher, options)

  return {
    trigger,
    isMutating,
  }
}
