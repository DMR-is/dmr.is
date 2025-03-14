import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdatePriceTriggerArgs = {
  feeCodes: string[]
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
      fetcher<Response, UpdatePriceTriggerArgs>(url.replace(':id', caseId), {
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
    data,
    error,
    trigger,
    isMutating,
    reset,
  }
}
