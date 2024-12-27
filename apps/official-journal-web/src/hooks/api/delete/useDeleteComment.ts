import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
      return fetcherV2<Response>(url.replace(':cid', arg.commentId), {
        arg: { withAuth: true, method: 'DELETE' },
      })
    },
    options,
  )

  return {
    trigger,
    isMutating,
  }
}
