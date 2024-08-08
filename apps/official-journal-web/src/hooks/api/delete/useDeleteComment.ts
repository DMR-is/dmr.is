import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { fetcher } from '../../../lib/constants'

type DeleteCommentTriggerArgs = {
  commentId: string
}

type UseDeleteCommentParams = {
  basePath: string
  options?: SWRMutationConfiguration<
    Response,
    Error,
    Key,
    DeleteCommentTriggerArgs
  >
}

export const useDeleteComment = ({
  basePath,
  options,
}: UseDeleteCommentParams) => {
  // Ensure the key is not null before calling swrMutation
  if (!basePath) {
    throw new Error('Key must be provided')
  }

  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    DeleteCommentTriggerArgs
  >(
    basePath,
    (url: string, { arg }: { arg: { commentId: string } }) => {
      return fetcher(url.replace(':cid', arg.commentId), {
        arg: { method: 'DELETE' },
      })
    },
    options,
  )

  return {
    trigger,
    isMutating,
  }
}
