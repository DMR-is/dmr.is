import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'
export type AddCommentTriggerArgs = {
  comment: string
}

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

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
  const {
    trigger: createInternalComment,
    isMutating: isCreatingInternalComment,
  } = swrMutation<Response, Error, Key, AddCommentTriggerArgs>(
    caseId ? APIRoutes.CreatInternalComment.replace(':id', caseId) : null,
    (url: string, { arg }: { arg: AddCommentTriggerArgs }) =>
      fetcher<Response, AddCommentTriggerArgs>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
    {
      ...options,
      throwOnError: false,
    },
  )

  const {
    trigger: createExternalComment,
    isMutating: isCreatingExternalComment,
  } = swrMutation<Response, Error, Key, AddCommentTriggerArgs>(
    caseId ? APIRoutes.CreatExternalComment.replace(':id', caseId) : null,
    (url: string, { arg }: { arg: AddCommentTriggerArgs }) =>
      fetcher<Response, AddCommentTriggerArgs>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    createInternalComment,
    isCreatingInternalComment,
    createExternalComment,
    isCreatingExternalComment,
  }
}
