import debounce from 'lodash/debounce'
import { toast } from 'react-toastify'

import {
  Button,
  Column,
  Columns,
  DatePicker,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { SignatureRecord } from '../../gen/fetch'
import { useSignature } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { SignatureDislay } from '../advert-display/SignatureDisplay'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { SignatureMember } from './SignatureMember'

type Props = {
  signature: SignatureRecord
}

export const Signature = ({ signature }: Props) => {
  const { refetch, canEdit } = useCaseContext()
  const {
    updateSignature,
    isUpdatingSignature,
    addSignatureMember,
    isAddingSignatureMember,
    removeSignatureMember,
    updateSignatureMember,
  } = useSignature({
    signatureId: signature.id,
    updateSignatureOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Undirritun uppfærð')
      },
      onError: () => {
        refetch()
        toast.error('Ekki tókst að uppfæra undirritun')
      },
    },
    addSignatureMemberOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Undirritara bætt við')
      },
      onError: () => {
        refetch()
        toast.error('Ekki tókst að bæta við undirritanda')
      },
    },
    deleteSignatureMemberOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Undirritara eytt')
      },
      onError: () => {
        refetch()
        toast.error('Ekki tókst að eyða undirritanda')
      },
    },
    updateSignatureMemberOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Meðlimur undirritunar uppfærður')
      },
      onError: () => {
        refetch()
        toast.error('Ekki tókst að uppfæra meðlim undirritunar')
      },
    },
  })

  const debouncedInstitutionChange = debounce(updateSignature, 500)

  const debouncedMemberChange = debounce(updateSignatureMember, 500)

  const onInstitutionChange = (value: string) => {
    debouncedInstitutionChange.cancel()
    debouncedInstitutionChange({ institution: value })
  }

  // const onMemberChange = (memberId: string, member: UpdateSignatureMember) => {
  //   debouncedMemberChange.cancel()
  //   debouncedMemberChange({
  //     memberId: memberId,
  //     ...member,
  //   })
  // }

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
              isValidating={isUpdatingSignature}
              defaultValue={signature.institution}
              label="Stofnun"
              name="institution"
              onChange={(e) => onInstitutionChange(e.target.value)}
            />
          </Column>
          <Column>
            <DatePicker
              disabled={!canEdit}
              locale="is"
              label="Dagsetning undirritunar"
              name="signature-date"
              selected={new Date(signature.signatureDate)}
              placeholderText="Dagsetning undirritunar"
              size="sm"
              backgroundColor="blue"
              handleChange={(date) =>
                updateSignature({ date: date.toISOString() })
              }
            />
          </Column>
        </Columns>
      </ContentWrapper>
      <ContentWrapper titleVariant="h5" titleAs="h5" title="Undirritað af">
        <Stack dividers space={2}>
          <Stack space={2} dividers>
            {signature.members.map((m) => (
              <SignatureMember
                onChange={() => console.log('change')}
                onDelete={() => removeSignatureMember({ memberId: m.id })}
                key={m.id}
                {...m}
              />
            ))}
          </Stack>
          <Inline justifyContent="flexEnd">
            <Button
              disabled={!canEdit}
              icon="add"
              iconType="outline"
              size="small"
              loading={isAddingSignatureMember}
              onClick={() => addSignatureMember()}
            >
              Bæta við undirritanda
            </Button>
          </Inline>
        </Stack>
      </ContentWrapper>
      <SignatureDislay />
    </Stack>
  )
}
