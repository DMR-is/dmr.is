import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateDepartmentTriggerArgs = {
  departmentId: string
}

type SWRUpdateDepartmentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateDepartmentTriggerArgs
>

type UseUpdateDepartmentParams = {
  options?: SWRUpdateDepartmentOptions
  caseId: string
}

export const useUpdateDepartment = ({
  caseId,
  options,
}: UseUpdateDepartmentParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdateDepartmentTriggerArgs
  >(APIRotues.UpdateDepartment.replace(':id', caseId), updateFetcher, {
    throwOnError: false,
    ...options,
  })

  return {
    data,
    error,
    trigger,
    isMutating,
    reset,
  }
}
