import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

export type UpdateCaseStatusParams = {
  caseId: string
  options?: SWRUpdateCaseStatusOptions
}

type UpdateCaseStatusTriggerArgs = {
  statusId: string
}

type SWRUpdateCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateCaseStatusTriggerArgs
>

export const useUpdateCaseStatus = ({
  caseId,
  options,
}: UpdateCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateCaseStatusTriggerArgs
  >(
    caseId ? APIRoutes.UpdateCaseStatus : null,
    (url: string, { arg }: { arg: UpdateCaseStatusTriggerArgs }) =>
      fetcher<Response, UpdateCaseStatusTriggerArgs>(
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
