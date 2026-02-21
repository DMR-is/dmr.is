import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

type DeleteCommentTriggerArgs = {
  commentId: string
}

type UseDeleteCommentParams = {
  options?: SWRMutationConfiguration<
    Response,
    Error,
    Key,
    DeleteCommentTriggerArgs
  >
}

export const useDeleteComment = ({ options }: UseDeleteCommentParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    DeleteCommentTriggerArgs
  >(
    APIRoutes.DeleteComment,
    (url: string, { arg }: { arg: DeleteCommentTriggerArgs }) => {
      return fetcher<Response>(url.replace(':cid', arg.commentId), {
        arg: { withAuth: true, method: 'DELETE' },
      })
    },
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    trigger,
    isMutating,
  }
}
