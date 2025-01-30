import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

export type UpdatePreviousCaseStatusParams = {
  caseId: string
  options?: SWRUpdatePreviousCaseStatusOptions
}

type SWRUpdatePreviousCaseStatusOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

export const useUpdatePreviousCaseStatus = ({
  caseId,
  options,
}: UpdatePreviousCaseStatusParams) => {
  const { trigger, isMutating } = swrMutation<Response, Error, Key, undefined>(
    APIRoutes.UpdatePreviousCaseStatus,
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
