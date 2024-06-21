import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, deleteComment } from '../../../lib/constants'

type SWRDeleteCommentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  {
    caseId: string
    commentId: string
  }
>

export const useDeleteComment = (options?: SWRDeleteCommentOptions) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    { caseId: string; commentId: string }
  >(APIRotues.DeleteComment, deleteComment, options)

  return {
    trigger,
    isMutating,
    options,
  }
}
