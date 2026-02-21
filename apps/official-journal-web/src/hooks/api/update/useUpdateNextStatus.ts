import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants-legacy'

export type UpdateNextCaseStatusParams = {
  caseId: string
  options?: SWRUpdateNextCaseStatusOptions
}

type SWRUpdateNextCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

export const useUpdateNextCaseStatus = ({
  caseId,
  options,
}: UpdateNextCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<Response, Error, Key, undefined>(
    caseId ? APIRoutes.UpdateNextCaseStatus : null,
    (url: string) =>
      fetcher<Response>(url.replace(':id', caseId), {
        arg: {
          withAuth: true,
          method: 'POST',
        },
      }),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    trigger,
    isMutating,
  }
}
