import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import { UpdateSignatureBody, UpdateSignatureMember } from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdateSignatureTriggerArgs = UpdateSignatureBody

type UpdateSignatureMemberTriggerArgs = UpdateSignatureMember & {
  memberId: string
}

type DeleteSignatureMemberTriggerArgs = {
  memberId: string
}

type SWRUpdateSignatureOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateSignatureTriggerArgs
>

type SWRUpdateSignatureMemberOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateSignatureMemberTriggerArgs
>

type SWRAddSignatureMemberOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

type SWRDeleteSignatureMemberOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  DeleteSignatureMemberTriggerArgs
>

type UseUpdateSignatureParams = {
  updateSignatureOptions?: SWRUpdateSignatureOptions
  updateSignatureMemberOptions?: SWRUpdateSignatureMemberOptions
  addSignatureMemberOptions?: SWRAddSignatureMemberOptions
  deleteSignatureMemberOptions?: SWRDeleteSignatureMemberOptions
  signatureId: string
}

export const useSignature = ({
  signatureId,
  updateSignatureOptions,
  updateSignatureMemberOptions,
  addSignatureMemberOptions,
  deleteSignatureMemberOptions,
}: UseUpdateSignatureParams) => {
  const { trigger: updateSignature, isMutating: isUpdatingSignature } =
    swrMutation<Response, Error, Key, UpdateSignatureTriggerArgs>(
      APIRoutes.Signature,
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
        ...updateSignatureOptions,
        throwOnError: false,
      },
    )

  const {
    trigger: updateSignatureMember,
    isMutating: isUpdatingSignatureMember,
  } = swrMutation<Response, Error, Key, UpdateSignatureMemberTriggerArgs>(
    APIRoutes.SignatureMember,
    (url: string, { arg }: { arg: UpdateSignatureMemberTriggerArgs }) => {
      const { memberId, ...body } = arg
      return fetcher<
        Response,
        Omit<UpdateSignatureMemberTriggerArgs, 'memberId'>
      >(url.replace(':id', signatureId).replace(':mid', memberId), {
        arg: {
          withAuth: true,
          method: 'PUT',
          body: body,
        },
      })
    },
    {
      ...updateSignatureMemberOptions,
      throwOnError: false,
    },
  )

  const { trigger: addSignatureMember, isMutating: isAddingSignatureMember } =
    swrMutation<Response, Error, Key, undefined>(
      APIRoutes.SignatureMember,
      (url: string) =>
        fetcher<Response, undefined>(url.replace(':id', signatureId), {
          arg: {
            withAuth: true,
            method: 'POST',
          },
        }),
      {
        ...addSignatureMemberOptions,
        throwOnError: false,
      },
    )

  const {
    trigger: removeSignatureMember,
    isMutating: isRemovingSignatureMember,
  } = swrMutation<Response, Error, Key, DeleteSignatureMemberTriggerArgs>(
    APIRoutes.SignatureMember,
    (url: string, { arg }: { arg: DeleteSignatureMemberTriggerArgs }) =>
      fetcher<Response>(
        url.replace(':id', signatureId).replace(':mid', arg.memberId),
        {
          arg: {
            withAuth: true,
            method: 'DELETE',
          },
        },
      ),
    {
      ...deleteSignatureMemberOptions,
      throwOnError: false,
    },
  )

  return {
    updateSignature,
    isUpdatingSignature,
    updateSignatureMember,
    isUpdatingSignatureMember,
    addSignatureMember,
    isAddingSignatureMember,
    removeSignatureMember,
    isRemovingSignatureMember,
  }
}
