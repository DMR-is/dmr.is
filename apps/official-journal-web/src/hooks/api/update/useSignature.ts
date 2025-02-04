import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { UpdateSignatureBody } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdateSignatureTriggerArgs = UpdateSignatureBody

type SWRUpdateSignatureOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateSignatureTriggerArgs
>

type UseUpdateSignatureParams = {
  options?: SWRUpdateSignatureOptions
  signatureId: string
}

export const useSignature = ({
  signatureId,
  options,
}: UseUpdateSignatureParams) => {
  const { trigger: updateSignature, isMutating: isUpdatingSignature } =
    swrMutation<Response, Error, Key, UpdateSignatureTriggerArgs>(
      APIRoutes.UpdateSignature,
      (url: string, { arg }: { arg: UpdateSignatureTriggerArgs }) =>
        fetcher<Response, UpdateSignatureTriggerArgs>(
          url.replace(':id', signatureId),
          {
            arg: {
              withAuth: true,
              method: 'PUT',
              body: arg,
            },
          },
        ),
      {
        ...options,
        throwOnError: false,
      },
    )

  return {
    updateSignature,
    isUpdatingSignature,
  }
}
