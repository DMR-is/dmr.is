import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcher } from '../../../lib/constants'

type UnpublishParams = {
  options?: SWRUnpublishCaseOptions
}

type UnpublishTriggerArgs = {
  caseId: string
}

type SWRUnpublishCaseOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UnpublishTriggerArgs
>

export const useUnpublishCase = ({ options }: UnpublishParams) => {
  const { trigger, isMutating, error } = swrMutation<
    Response,
    Error,
    Key,
    UnpublishTriggerArgs
  >(
    APIRoutes.UnpublishCase,
    (url: string, { arg }: { arg: UnpublishTriggerArgs }) =>
      fetcher<Response, UnpublishTriggerArgs>(url.replace(':id', arg.caseId), {
        arg: {
          withAuth: true,
          method: 'POST',
        },
      }),
    { ...options, throwOnError: false },
  )

  return {
    trigger,
    isMutating,
    error,
  }
}
