import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type UpdateTitleTriggerArgs = {
  title: string
}

type SWRUpdateTitleOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTitleTriggerArgs
>

type UseUpdateTitleParams = {
  options?: SWRUpdateTitleOptions
  caseId: string
}
export const useUpdateTitle = ({ caseId, options }: UseUpdateTitleParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTitleTriggerArgs
  >(
    APIRoutes.UpdateTitle,
    (url: string, { arg }: { arg: UpdateTitleTriggerArgs }) =>
      fetcherV2<Response, UpdateTitleTriggerArgs>(url.replace(':id', caseId), {
        arg: {
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
