import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type UpdateNextCaseStatusTriggerArgs = {
  currentStatus: string
}

export type UpdateNextCaseStatusParams = {
  caseId: string
  options?: SWRUpdateNextCaseStatusOptions
}

type SWRUpdateNextCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateNextCaseStatusTriggerArgs
>

export const useUpdateNextCaseStatus = ({
  caseId,
  options,
}: UpdateNextCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateNextCaseStatusTriggerArgs
  >(
    caseId ? APIRoutes.UpdateNextCaseStatus : null,
    (url: string, { arg }: { arg: UpdateNextCaseStatusTriggerArgs }) =>
      fetcherV2<Response, UpdateNextCaseStatusTriggerArgs>(
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
