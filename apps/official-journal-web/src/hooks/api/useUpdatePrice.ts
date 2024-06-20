import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updatePrice } from '../../lib/constants'

type SWRUpdatePriceOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  {
    caseId: string
    price: string
  }
>

type UseUpdatePriceParams = {
  options?: SWRUpdatePriceOptions
  caseId: string
}

export const useUpdatePrice = ({ caseId, options }: UseUpdatePriceParams) => {
  const { trigger, isMutating } = swrMutation<
    Response,
    Error,
    Key,
    { caseId: string; price: string }
  >(APIRotues.UpdatePrice.replace(':id', caseId), updatePrice, options)

  return {
    trigger,
    isMutating,
    options,
  }
}
