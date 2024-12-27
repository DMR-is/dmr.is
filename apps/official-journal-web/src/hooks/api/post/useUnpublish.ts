import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { APIRoutes, fetcherV2 } from '../../../lib/constants'

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
      fetcherV2<Response, UnpublishTriggerArgs>(
        url.replace(':id', arg.caseId),
        {
          arg: {
            withAuth: true,
            method: 'POST',
          },
        },
      ),
    options,
  )

  return {
    trigger,
    isMutating,
    error,
  }
}
