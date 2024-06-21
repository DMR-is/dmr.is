import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, assignEmployee } from '../../../lib/constants'

export type SWRUpdateEmployeeParams = {
  userId: string
  caseId: string
}

type SWRUpdateEmployeeOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  SWRUpdateEmployeeParams
>

export const useUpdateEmployee = (options?: SWRUpdateEmployeeOptions) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    SWRUpdateEmployeeParams
  >(APIRotues.AssignEmployee, assignEmployee, options)

  return {
    trigger,
    isMutating,
  }
}
