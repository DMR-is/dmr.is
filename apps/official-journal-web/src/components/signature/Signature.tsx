import debounce from 'lodash/debounce'
import { useCallback } from 'react'

import {
  Button,
  Column,
  Columns,
  DatePicker,
  Inline,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import {
  CreateSignatureMemberMemberTypeEnum,
  SignatureMember as SignatureMemberDto,
  SignatureRecord as SignatureRecordDto,
  UpdateSignatureRecord,
} from '../../gen/fetch'
import { useUpdateSignature } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { SignatureMember } from './SignatureMember'

type Props = {
  record: SignatureRecordDto
}

type SignatureRecordKey = keyof UpdateSignatureRecord

export const SignatureRecord = ({ record }: Props) => {
  const { refetchSignature, currentCase, canEdit } = useCaseContext()
  const {
    updateSignatureRecord,
    isUpdatingSignatureRecord,
    addSignatureMember,
    isAddingSignatureMember,
    removeSignatureMember,
    isRemovingSignatureMember,
    updateSignatureMember,
    isUpdatingSignatureMember,
  } = useUpdateSignature({
    signatureId: currentCase.signature.id,
    addSignatureRecordOptions: {
      onSuccess: () => {
        toast.success('Auka undirritun bætt við')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tóskt að bæta við undirritun')
      },
    },
    updateSignatureRecordOptions: {
      onSuccess: () => {
        toast.success('Undirritun uppfærð')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að vista undirritun')
      },
    },
    addSignatureMemberOptions: {
      onSuccess: () => {
        toast.success('Undirritara bætt við')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við undirritanda')
      },
    },
    deleteSignatureMemberOptions: {
      onSuccess: () => {
        toast.success('Undirritara eytt')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að eyða undirritanda')
      },
    },
    updateSignatureMemberOptions: {
      onSuccess: () => {
        toast.success('Undirritari uppfærður')
        refetchSignature()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra undirritara')
      },
    },
  })

  const updateRecord = (key: SignatureRecordKey, value: string) => {
    updateSignatureRecord({
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
    updateSignatureMember({
      recordId: record.id,
      memberId,
      [key]: value,
    })
  }

  const handleMemberchange = useCallback(debounce(updateMember, 500), [])

  const updateAdditional = (value: string) => {
    updateSignatureRecord({
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
        title="Stofnun og dagsetning"
      >
        <Columns space={2}>
          <Column>
            <OJOIInput
              disabled={!canEdit}
              isValidating={isUpdatingSignatureRecord}
              defaultValue={record.institution}
              label="Stofnun"
              name="institution"
              onChange={(e) =>
                handleRecordChange('institution', e.target.value)
              }
            />
          </Column>
          <Column>
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
                  addSignatureMember({
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
              isDeleting={isRemovingSignatureMember}
              isUpdating={isUpdatingSignatureMember}
              onChange={(key, value) =>
                handleMemberchange(chairman.id, key, value)
              }
              onDelete={() =>
                removeSignatureMember({
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
                isDeleting={isRemovingSignatureMember}
                isUpdating={isUpdatingSignatureMember}
                onChange={(key, value) => handleMemberchange(m.id, key, value)}
                onDelete={() =>
                  removeSignatureMember({ recordId: record.id, memberId: m.id })
                }
              />
            ))}
          </Stack>
          <Inline justifyContent="flexEnd">
            <Button
              variant="utility"
              disabled={!canEdit}
              loading={isAddingSignatureMember}
              icon="add"
              iconType="outline"
              size="small"
              onClick={() =>
                addSignatureMember({
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
          name={`${record.id}-additional`}
          onChange={(e) => handleAdditionChange(e.target.value)}
        />
      </ContentWrapper>
    </Stack>
  )
}
