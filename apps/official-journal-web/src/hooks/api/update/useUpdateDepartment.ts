import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

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
  >(
    APIRoutes.UpdateDepartment,
    (url: string, { arg }: { arg: UpdateDepartmentTriggerArgs }) =>
      fetcher<Response, UpdateDepartmentTriggerArgs>(
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
