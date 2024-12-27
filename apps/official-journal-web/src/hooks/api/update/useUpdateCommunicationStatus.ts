import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
    APIRoutes.UpdateCommunicationStatus,
    (url: string, { arg }: { arg: UpdateCommunicationStatusTriggerArgs }) =>
      fetcherV2<Response, UpdateCommunicationStatusTriggerArgs>(
        url.replace(':id', caseId),
        {
          arg: {
            withAuth: true,
            method: 'POST',
            body: arg,
          },
        },
      ),
    {
      throwOnError: false,
      ...options,
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
