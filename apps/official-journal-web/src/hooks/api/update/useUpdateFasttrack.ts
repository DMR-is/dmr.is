import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

type UpdateFasttrackTriggerArgs = {
  fastTrack: boolean
}

type SWRUpdateFastTrackOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateFasttrackTriggerArgs
>

type UseUpdateFastTrackParams = {
  options?: SWRUpdateFastTrackOptions
  caseId: string
}

export const useUpdateFastTrack = ({
  caseId,
  options,
}: UseUpdateFastTrackParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateFasttrackTriggerArgs
  >(
    APIRoutes.UpdateFasttrack,
    (url: string, { arg }: { arg: UpdateFasttrackTriggerArgs }) =>
      fetcher<Response, UpdateFasttrackTriggerArgs>(
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
