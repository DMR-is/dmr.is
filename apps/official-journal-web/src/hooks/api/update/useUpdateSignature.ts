import { Key } from 'swr'
import swrMutation, { SWRMutationConfiguration } from 'swr/mutation'

import {
  CreateSignatureMemberMemberTypeEnum,
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
  memberType: CreateSignatureMemberMemberTypeEnum
}

type DeleteSignatureMemberTriggerArgs = {
  recordId: string
  memberId: string
}

type DeleteSignatureRecordTriggerArgs = {
  recordId: string
}

type SWRAddSignatureRecord = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  undefined
>

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

type DeleteSignatureRecordOptions = SWRMutationConfiguration<
  Response,
  Error,
  Key,
  DeleteSignatureRecordTriggerArgs
>

type UseUpdateSignatureParams = {
  addSignatureRecordOptions?: SWRAddSignatureRecord
  updateSignatureRecordOptions?: SWRUpdateSignatureRecord
  updateSignatureMemberOptions?: SWRUpdateSignatureMemberOptions
  addSignatureMemberOptions?: SWRAddSignatureMemberOptions
  deleteSignatureMemberOptions?: SWRDeleteSignatureMemberOptions
  deleteSignatureRecordOptions?: DeleteSignatureRecordOptions
  signatureId: string
}

export const useUpdateSignature = ({
  signatureId,
  addSignatureRecordOptions,
  updateSignatureRecordOptions,
  updateSignatureMemberOptions,
  addSignatureMemberOptions,
  deleteSignatureMemberOptions,
  deleteSignatureRecordOptions,
}: UseUpdateSignatureParams) => {
  const { trigger: addSignatureRecord, isMutating: isAddingSignatureRecord } =
    swrMutation<Response, Error, Key, undefined>(
      APIRoutes.SignatureRecords,
      (url: string) =>
        fetcher<Response>(url.replace(':id', signatureId), {
          arg: {
            withAuth: true,
            method: 'POST',
          },
        }),
      {
        ...addSignatureRecordOptions,
        throwOnError: false,
      },
    )

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
        fetcher<Response, Omit<AddSignatureMemberTriggerArgs, 'recordId'>>(
          url.replace(':id', signatureId).replace(':recordId', arg.recordId),
          {
            arg: {
              withAuth: true,
              method: 'POST',
              body: arg,
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

  const {
    trigger: removeSignatureRecord,
    isMutating: isRemovingSignatureRecord,
  } = swrMutation<Response, Error, Key, DeleteSignatureRecordTriggerArgs>(
    APIRoutes.SignatureRecord,
    (url: string, { arg }: { arg: DeleteSignatureRecordTriggerArgs }) =>
      fetcher<Response>(
        url.replace(':id', signatureId).replace(':recordId', arg.recordId),
        {
          arg: {
            withAuth: true,
            method: 'DELETE',
          },
        },
      ),
    {
      ...deleteSignatureRecordOptions,
      throwOnError: false,
    },
  )

  return {
    addSignatureRecord,
    isAddingSignatureRecord,
    updateSignatureRecord,
    isUpdatingSignatureRecord,
    updateSignatureMember,
    isUpdatingSignatureMember,
    addSignatureMember,
    isAddingSignatureMember,
    removeSignatureMember,
    isRemovingSignatureMember,
    removeSignatureRecord,
    isRemovingSignatureRecord,
  }
}
