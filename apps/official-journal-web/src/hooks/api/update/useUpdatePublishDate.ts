import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdatePublishDateTriggerArgs = {
  date: string
}

type SWRUpdatePublishDateOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePublishDateTriggerArgs
>

type UseUpdatePublishDateParams = {
  options?: SWRUpdatePublishDateOptions
  caseId: string
}
export const useUpdatePublishDate = ({
  caseId,
  options,
}: UseUpdatePublishDateParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePublishDateTriggerArgs
  >(
    APIRoutes.UpdatePublishDate,
    (url: string, { arg }: { arg: UpdatePublishDateTriggerArgs }) =>
      fetcher<Response, UpdatePublishDateTriggerArgs>(
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
