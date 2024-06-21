import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateDepartment } from '../../../lib/constants'

type SWRUpdateDepartmentOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  {
    caseId: string
    departmentId: string
  }
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
    { caseId: string; departmentId: string }
  >(APIRotues.UpdateDepartment.replace(':id', caseId), updateDepartment, {
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
