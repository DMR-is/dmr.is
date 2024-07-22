import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdatePriceTriggerArgs = {
  price: string
}

type SWRUpdatePriceOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdatePriceTriggerArgs
>

type UseUpdatePriceParams = {
  options?: SWRUpdatePriceOptions
  caseId: string
}

export const useUpdatePrice = ({ caseId, options }: UseUpdatePriceParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    UpdatePriceTriggerArgs
  >(APIRotues.UpdatePrice.replace(':id', caseId), updateFetcher, {
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
