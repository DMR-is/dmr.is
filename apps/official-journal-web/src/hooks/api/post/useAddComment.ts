import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type AddCommentTriggerArgs = {
  caseId: string
  internal: boolean
  comment: string
  creator: string
  receiver?: string
}

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
  >(
    caseId ? APIRoutes.CreateComment.replace(':id', caseId) : null,
    (url: string, { arg }: { arg: AddCommentTriggerArgs }) =>
      fetcherV2<Response, AddCommentTriggerArgs>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
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
