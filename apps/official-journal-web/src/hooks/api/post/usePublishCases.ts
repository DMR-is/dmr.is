import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

export type PublishCasesTriggerArgs = {
  caseIds: string[]
}

type SWRPublishCasesOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  PublishCasesTriggerArgs
>

export const usePublishCases = (options?: SWRPublishCasesOptions) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    PublishCasesTriggerArgs
  >(
    APIRoutes.PublishCases,
    (url: string, { arg }: { arg: PublishCasesTriggerArgs }) =>
      fetcherV2<Response, PublishCasesTriggerArgs>(url, {
        arg: { withAuth: true, method: 'POST', body: arg },
      }),
    {
      ...options,
      throwOnError: false,
    },
  )

  return {
    trigger,
    isMutating,
    error,
  }
}
