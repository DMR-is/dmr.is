import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdateTagTriggerArgs = {
  tagId: string
}

type SWRUpdateTagOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTagTriggerArgs
>

type UseUpdateTagParams = {
  options?: SWRUpdateTagOptions
  caseId: string
}

export const useUpdateTag = ({ caseId, options }: UseUpdateTagParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTagTriggerArgs
  >(
    APIRoutes.UpdateTag,
    (url: string, { arg }: { arg: UpdateTagTriggerArgs }) =>
      fetcher<Response, UpdateTagTriggerArgs>(url.replace(':id', caseId), {
        arg: {
          withAuth: true,
          method: 'POST',
          body: arg,
        },
      }),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    data,
    error,
    trigger,
    isMutating,
    reset,
  }
}
