import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRotues, updateFetcher } from '../../../lib/constants'

type UpdateCategoriesTriggerArgs = {
  categoryIds: string[]
}

type SWRUpdateCategoryOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateCategoriesTriggerArgs
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
    UpdateCategoriesTriggerArgs
  >(APIRotues.UpdateCategories.replace(':id', caseId), updateFetcher, {
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
