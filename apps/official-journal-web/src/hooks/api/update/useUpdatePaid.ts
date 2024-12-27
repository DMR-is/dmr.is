import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type UpdatePaidTriggerArgs = {
  paid: boolean
}

type SWRUpdatePaidOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePaidTriggerArgs
>

type UseUpdatePaidParams = {
  options?: SWRUpdatePaidOptions
  caseId: string
}

export const useUpdatePaid = ({ caseId, options }: UseUpdatePaidParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePaidTriggerArgs
  >(
    APIRoutes.UpdatePaid,
    (url: string, { arg }: { arg: UpdatePaidTriggerArgs }) =>
      fetcherV2<Response, UpdatePaidTriggerArgs>(url.replace(':id', caseId), {
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
