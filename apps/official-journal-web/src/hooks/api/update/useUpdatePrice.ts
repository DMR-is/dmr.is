import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type UpdatePriceTriggerArgs = {
  price: number
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
  >(
    APIRoutes.UpdatePrice,
    (url: string, { arg }: { arg: UpdatePriceTriggerArgs }) =>
      fetcherV2<Response, UpdatePriceTriggerArgs>(url.replace(':id', caseId), {
        arg: {
          withAuth: true,
          method: 'POST',
          body: arg,
        },
      }),
    {
      throwOnError: false,
      ...options,
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
