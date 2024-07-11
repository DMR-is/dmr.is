import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

export type UpdateEmployeeParams = {
  caseId: string
  options?: SWRUpdateEmployeeOptions
}

type UpdateEmployeeTriggerArgs = {
  employeeId: string
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
  >(APIRotues.UpdateEmployee.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    trigger,
    isMutating,
  }
}
