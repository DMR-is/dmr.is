import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
      fetcherV2<Response, UpdateCaseStatusTriggerArgs>(
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
    trigger,
    isMutating,
  }
}
