import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

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
      fetcher<Response, UpdateEmployeeTriggerArgs>(url.replace(':id', caseId), {
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
    trigger,
    isMutating,
  }
}
