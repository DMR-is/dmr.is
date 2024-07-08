import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateCategories } from '../../../lib/constants'

type SWRUpdateCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  {
    caseId: string
    categoryIds: string[]
  }
>

type UseUpdateCategoryParams = {
  options?: SWRUpdateCategoryOptions
  caseId: string
}
export const useUpdateCategories = ({
  caseId,
  options,
}: UseUpdateCategoryParams) => {
  const { trigger, isMutating, data, error, reset } = swrMutation<
    Response,
    Error,
    Key,
    { caseId: string; categoryIds: string[] }
  >(APIRotues.UpdateCategories.replace(':id', caseId), updateCategories, {
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
