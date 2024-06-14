import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, assignEmployee } from '../../lib/constants'

export type SWRAssignEmployeeParams = {
  userId: string
  caseId: string
}

type SWRAssignEmployeeOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRAssignEmployeeParams
>

export const useAssignEmployee = (options?: SWRAssignEmployeeOptions) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRAssignEmployeeParams
  >(APIRotues.AssignEmployee, assignEmployee, options)

  return {
    trigger,
    isMutating,
  }
}
