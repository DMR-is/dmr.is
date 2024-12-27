import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

export type UpdateEmployeeParams = {
  caseId: string
  options?: SWRUpdateEmployeeOptions
}

type UpdateEmployeeTriggerArgs = {
  userId: string
}

type SWRUpdateEmployeeOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateEmployeeTriggerArgs
>

export const useUpdateEmployee = ({
  caseId,
  options,
}: UpdateEmployeeParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    UpdateEmployeeTriggerArgs
  >(
    APIRoutes.UpdateEmployee,
    (url: string, { arg }: { arg: UpdateEmployeeTriggerArgs }) =>
      fetcherV2<Response, UpdateEmployeeTriggerArgs>(
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
