import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

type UpdateCommunicationStatusTriggerArgs = {
  statusId: string
}

type SWRUpdateCommunicationStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateCommunicationStatusTriggerArgs
>

type UseUpdateCommunicationStatusParams = {
  options?: SWRUpdateCommunicationStatusOptions
  caseId: string
}

export const useUpdateCommunicationStatus = ({
  caseId,
  options,
}: UseUpdateCommunicationStatusParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateCommunicationStatusTriggerArgs
  >(
    caseId ? APIRoutes.UpdateCommunicationStatus.replace(':id', caseId) : null,
    (url: string, { arg }: { arg: UpdateCommunicationStatusTriggerArgs }) =>
      fetcher<Response, UpdateCommunicationStatusTriggerArgs>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
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
