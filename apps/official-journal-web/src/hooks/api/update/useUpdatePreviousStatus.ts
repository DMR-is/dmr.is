import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdatePreviousCaseStatusTriggerArgs = {
  currentStatus: string
}

export type UpdatePreviousCaseStatusParams = {
  caseId: string
  options?: SWRUpdatePreviousCaseStatusOptions
}

type SWRUpdatePreviousCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePreviousCaseStatusTriggerArgs
>

export const useUpdatePreviousCaseStatus = ({
  caseId,
  options,
}: UpdatePreviousCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePreviousCaseStatusTriggerArgs
  >(
    APIRoutes.UpdatePreviousCaseStatus,
    (url: string, { arg }: { arg: UpdatePreviousCaseStatusTriggerArgs }) =>
      fetcher<Response, UpdatePreviousCaseStatusTriggerArgs>(
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
    trigger,
    isMutating,
  }
}
