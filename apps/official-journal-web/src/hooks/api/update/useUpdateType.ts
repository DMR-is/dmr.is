import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type UpdateTypeTriggerArgs = {
  typeId: string
}

type SWRUpdateTypeOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateTypeTriggerArgs
>

type UseUpdateTypeParams = {
  options?: SWRUpdateTypeOptions
  caseId: string
}

export const useUpdateType = ({ caseId, options }: UseUpdateTypeParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateTypeTriggerArgs
  >(
    APIRoutes.UpdateCaseType,
    (url: string, { arg }: { arg: UpdateTypeTriggerArgs }) =>
      fetcherV2<Response, UpdateTypeTriggerArgs>(url.replace(':id', caseId), {
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
