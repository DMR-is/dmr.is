import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
  >(
    APIRoutes.UpdateCategories,
    (url: string, { arg }: { arg: UpdateCategoriesTriggerArgs }) =>
      fetcherV2<Response, UpdateCategoriesTriggerArgs>(
        url.replace(':id', caseId),
        {
          arg: {
            method: 'POST',
            body: arg,
            withAuth: true,
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
