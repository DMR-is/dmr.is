import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  UpdateSignatureMember,
  UpdateSignatureRecord,
} from '../../../gen/fetch'
import { APIRoutes, fetcher } from '../../../lib/constants'

type UpdateSignatureRecordTriggerArgs = UpdateSignatureRecord & {
  recordId: string
}

type UpdateSignatureMemberTriggerArgs = UpdateSignatureMember & {
  recordId: string
  memberId: string
}

type AddSignatureMemberTriggerArgs = {
  recordId: string
}

type DeleteSignatureMemberTriggerArgs = {
  recordId: string
  memberId: string
}

type SWRUpdateSignatureRecord = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  UpdateSignatureRecordTriggerArgs
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
  AddSignatureMemberTriggerArgs
>

type SWRDeleteSignatureMemberOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  DeleteSignatureMemberTriggerArgs
>

type UseUpdateSignatureParams = {
  updateSignatureRecordOptions?: SWRUpdateSignatureRecord
  updateSignatureMemberOptions?: SWRUpdateSignatureMemberOptions
  addSignatureMemberOptions?: SWRAddSignatureMemberOptions
  deleteSignatureMemberOptions?: SWRDeleteSignatureMemberOptions
  signatureId: string
}

export const useUpdateSignature = ({
  signatureId,
  updateSignatureRecordOptions,
  updateSignatureMemberOptions,
  addSignatureMemberOptions,
  deleteSignatureMemberOptions,
}: UseUpdateSignatureParams) => {
  const {
    trigger: updateSignatureRecord,
    isMutating: isUpdatingSignatureRecord,
  } = swrMutation<Response, Error, Key, UpdateSignatureRecordTriggerArgs>(
    APIRoutes.SignatureRecord,
    (url: string, { arg }: { arg: UpdateSignatureRecordTriggerArgs }) => {
      const { recordId, ...body } = arg
      return fetcher<
        Response,
        Omit<UpdateSignatureRecordTriggerArgs, 'recordId'>
      >(url.replace(':id', signatureId).replace(':recordId', recordId), {
        arg: {
          withAuth: true,
          method: 'PUT',
          body: body,
        },
      })
    },
    {
      ...updateSignatureRecordOptions,
      throwOnError: false,
    },
  )

  const {
    trigger: updateSignatureMember,
    isMutating: isUpdatingSignatureMember,
  } = swrMutation<Response, Error, Key, UpdateSignatureMemberTriggerArgs>(
    APIRoutes.SignatureMember,
    (url: string, { arg }: { arg: UpdateSignatureMemberTriggerArgs }) => {
      const { memberId, recordId, ...body } = arg
      return fetcher<
        Response,
        Omit<UpdateSignatureMemberTriggerArgs, 'memberId' | 'recordId'>
      >(
        url
          .replace(':id', signatureId)
          .replace(':recordId', recordId)
          .replace(':mid', memberId),
        {
          arg: {
            withAuth: true,
            method: 'PUT',
            body: body,
          },
        },
      )
    },
    {
      ...updateSignatureMemberOptions,
      throwOnError: false,
    },
  )

  const { trigger: addSignatureMember, isMutating: isAddingSignatureMember } =
    swrMutation<Response, Error, Key, AddSignatureMemberTriggerArgs>(
      APIRoutes.SignatureMembers,
      (url: string, { arg }: { arg: AddSignatureMemberTriggerArgs }) =>
        fetcher<Response>(
          url.replace(':id', signatureId).replace(':recordId', arg.recordId),
          {
            arg: {
              withAuth: true,
              method: 'POST',
            },
          },
        ),
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
        url
          .replace(':id', signatureId)
          .replace(':recordId', arg.recordId)
          .replace(':mid', arg.memberId),
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
    updateSignatureRecord,
    isUpdatingSignatureRecord,
    updateSignatureMember,
    isUpdatingSignatureMember,
    addSignatureMember,
    isAddingSignatureMember,
    removeSignatureMember,
    isRemovingSignatureMember,
  }
}
