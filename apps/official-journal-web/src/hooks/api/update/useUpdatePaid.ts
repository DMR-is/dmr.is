import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdatePaidTriggerArgs = {
  paid: boolean
}

type SWRUpdatePaidOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePaidTriggerArgs
>

type UseUpdatePaidParams = {
  options?: SWRUpdatePaidOptions
  caseId: string
}

export const useUpdatePaid = ({ caseId, options }: UseUpdatePaidParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePaidTriggerArgs
  >(APIRotues.UpdatePaid.replace(':id', caseId), updateFetcher, {
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
