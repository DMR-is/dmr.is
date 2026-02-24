import { useCallback } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Column } from '@dmr.is/ui/components/island-is/Column'
import { Columns } from '@dmr.is/ui/components/island-is/Columns'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { debounce } from '@dmr.is/utils/shared/lodash/debounce'

import {
  CreateSignatureMemberMemberTypeEnum,
  SignatureMember as SignatureMemberDto,
  SignatureRecord as SignatureRecordDto,
  UpdateSignatureRecord,
} from '../../gen/fetch'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { SignatureMember } from './SignatureMember'

import { useMutation } from '@tanstack/react-query'

type Props = {
  record: SignatureRecordDto
}

type SignatureRecordKey = keyof UpdateSignatureRecord

export const SignatureRecord = ({ record }: Props) => {
  const { refetchSignature, currentCase, canEdit } = useCaseContext()
  const trpc = useTRPC()
  const signatureId = currentCase.signature.id

  const updateSignatureRecordMutation = useMutation(
    trpc.updateSignatureRecord.mutationOptions({
      onSuccess: () => {
        toast.success('Undirritun uppfærð')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að vista undirritun')
      },
    }),
  )

  const addSignatureMemberMutation = useMutation(
    trpc.addSignatureMember.mutationOptions({
      onSuccess: () => {
        toast.success('Undirritara bætt við')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við undirritanda')
      },
    }),
  )

  const removeSignatureMemberMutation = useMutation(
    trpc.deleteSignatureMember.mutationOptions({
      onSuccess: () => {
        toast.success('Undirritara eytt')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða undirritanda')
      },
    }),
  )

  const updateSignatureMemberMutation = useMutation(
    trpc.updateSignatureMember.mutationOptions({
      onSuccess: () => {
        toast.success('Undirritari uppfærður')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra undirritara')
      },
    }),
  )

  const removeSignatureRecordMutation = useMutation(
    trpc.deleteSignatureRecord.mutationOptions({
      onSuccess: () => {
        toast.success('Undirritunar kafla eytt')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða undirritunar kafla')
      },
    }),
  )

  const updateRecord = (key: SignatureRecordKey, value: string) => {
    updateSignatureRecordMutation.mutate({
      signatureId,
      recordId: record.id,
      [key]: value,
    })
  }

  const handleRecordChange = useCallback(debounce(updateRecord, 500), [])

  const updateMember = (
    memberId: string,
    key: keyof SignatureMemberDto,
    value: string,
  ) => {
    updateSignatureMemberMutation.mutate({
      signatureId,
      recordId: record.id,
      memberId,
      [key]: value,
    })
  }

  const handleMemberchange = useCallback(debounce(updateMember, 500), [])

  const updateAdditional = (value: string) => {
    updateSignatureRecordMutation.mutate({
      signatureId,
      recordId: record.id,
      additional: value,
    })
  }

  const handleAdditionChange = useCallback(debounce(updateAdditional, 500), [])

  const { chairman } = record

  return (
    <Stack space={2}>
      <ContentWrapper
        titleVariant="h5"
        titleAs="h5"
        title="Undirskriftarstaður/Stofnun og dagsetning"
      >
        <Columns space={2}>
          <Column>
            <OJOIInput
              disabled={!canEdit}
              isValidating={updateSignatureRecordMutation.isPending}
              defaultValue={record.institution}
              label="Staður eða stofnun (þgf.)"
              name="institution"
              onChange={(e) =>
                handleRecordChange('institution', e.target.value)
              }
            />
          </Column>
          <Column>
            <Stack space={2}>
              <DatePicker
                disabled={!canEdit}
                locale="is"
                label="Dagsetning undirritunar"
                name="signature-date"
                selected={new Date(record.signatureDate)}
                placeholderText="Dagsetning undirritunar"
                size="sm"
                backgroundColor="blue"
                handleChange={(date) =>
                  handleRecordChange('signatureDate', date.toISOString())
                }
              />
              <Inline justifyContent="flexEnd">
                <Button
                  disabled={!canEdit}
                  loading={removeSignatureRecordMutation.isPending}
                  onClick={() =>
                    removeSignatureRecordMutation.mutate({
                      signatureId,
                      recordId: record.id,
                    })
                  }
                  variant="utility"
                  size="small"
                  colorScheme="destructive"
                  icon="trash"
                  iconType="outline"
                >
                  Eyða undirritunar kafla
                </Button>
              </Inline>
            </Stack>
          </Column>
        </Columns>
      </ContentWrapper>
      <ContentWrapper>
        <Stack space={2}>
          <Inline justifyContent="spaceBetween" alignY="center">
            <Text variant="h5">Formaður</Text>
            {chairman === null && (
              <Button
                disabled={!canEdit}
                variant="utility"
                size="small"
                icon="add"
                onClick={() =>
                  addSignatureMemberMutation.mutate({
                    signatureId,
                    recordId: record.id,
                    memberType: CreateSignatureMemberMemberTypeEnum.CHAIRMAN,
                  })
                }
              >
                Bæta við formanni
              </Button>
            )}
          </Inline>
          {chairman !== null && (
            <SignatureMember
              {...chairman}
              isDeleting={removeSignatureMemberMutation.isPending}
              isUpdating={updateSignatureMemberMutation.isPending}
              onChange={(key, value) =>
                handleMemberchange(chairman.id, key, value)
              }
              onDelete={() =>
                removeSignatureMemberMutation.mutate({
                  signatureId,
                  recordId: record.id,
                  memberId: chairman.id,
                })
              }
            />
          )}
        </Stack>
      </ContentWrapper>
      <ContentWrapper titleVariant="h5" titleAs="h5" title="Undirritað af">
        <Stack dividers space={2}>
          <Stack space={2} dividers>
            {record.members.map((m) => (
              <SignatureMember
                {...m}
                key={m.id}
                isDeleting={removeSignatureMemberMutation.isPending}
                isUpdating={updateSignatureMemberMutation.isPending}
                onChange={(key, value) => handleMemberchange(m.id, key, value)}
                onDelete={() =>
                  removeSignatureMemberMutation.mutate({
                    signatureId,
                    recordId: record.id,
                    memberId: m.id,
                  })
                }
              />
            ))}
          </Stack>
          <Inline justifyContent="flexEnd">
            <Button
              variant="utility"
              disabled={!canEdit}
              loading={addSignatureMemberMutation.isPending}
              icon="add"
              iconType="outline"
              size="small"
              onClick={() =>
                addSignatureMemberMutation.mutate({
                  signatureId,
                  recordId: record.id,
                  memberType: CreateSignatureMemberMemberTypeEnum.MEMBER,
                })
              }
            >
              Bæta við undirritanda
            </Button>
          </Inline>
        </Stack>
      </ContentWrapper>
      <ContentWrapper title="Aukaundirritun" titleVariant="h5" titleAs="h5">
        <OJOIInput
          disabled={!canEdit}
          label="Nafn"
          defaultValue={record.additional ?? ''}
          name={`${record.id}-additional`}
          onChange={(e) => handleAdditionChange(e.target.value)}
        />
      </ContentWrapper>
    </Stack>
  )
}
