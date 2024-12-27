import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

type RejectCaseTriggerArgs = {
  caseId: string
}
type Configuration = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  RejectCaseTriggerArgs
>
type RejectParams = {
  options?: Configuration
}

export const useRejectCase = ({ options }: RejectParams) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    RejectCaseTriggerArgs
  >(
    APIRoutes.RejectCase,
    (url: string, { arg }: { arg: RejectCaseTriggerArgs }) =>
      fetcherV2<Response>(url.replace(':id', arg.caseId), {
        arg: { withAuth: true, method: 'POST' },
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
