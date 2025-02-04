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

import {
  Signature as SignatureDto,
  SignatureMember as SignatureMemberDto,
} from '../../gen/fetch'
import { useSignature } from '../../hooks/api'
import { useCaseContext } from '../../hooks/useCaseContext'
import { SignatureDislay } from '../advert-display/SignatureDisplay'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { OJOIInput } from '../select/OJOIInput'
import { SignatureMember } from './SignatureMember'

type Props = {
  signature: SignatureDto
}

export const Signature = ({ signature }: Props) => {
  const { refetch, canEdit } = useCaseContext()
  const { updateSignature, isUpdatingSignature } = useSignature({
    signatureId: signature.id,
    options: {
      onSuccess: () => {
        refetch()
        toast.success('Undirritun uppfærð')
      },
      onError: () => {
        refetch()
        toast.error('Ekki tókst að uppfæra undirritun')
      },
    },
  })

  const debouncedInstitutionChange = debounce(updateSignature, 500)

  const onInstitutionChange = (value: string) => {
    debouncedInstitutionChange.cancel()
    debouncedInstitutionChange({ institution: value })
  }

  const handleMemberChange = (
    key: keyof SignatureMemberDto,
    value: string,
    index: number,
  ) => {
    const members = signature.members.map((m, i) =>
      i === index ? { ...m, [key]: value } : m,
    )

    updateSignature({
      members: members,
    })
  }

  const canDelete = signature.members.length > 1 && canEdit
  const handleDelete = (index: number) => {
    updateSignature({
      members: signature.members.filter((_, i) => i !== index),
    })
  }

  const handleAddMember = () => {
    updateSignature({
      members: [
        ...signature.members,
        {
          text: '',
          textAbove: '',
          textAfter: '',
          textBelow: '',
        },
      ],
    })
  }

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
              isValidating={isUpdatingSignature}
              defaultValue={signature.institution}
              label="Stofnun"
              name="institution"
              onChange={(e) => onInstitutionChange(e.target.value)}
            />
          </Column>
          <Column>
            <DatePicker
              locale="is"
              label="Dagsetning undirritunar"
              name="signature-date"
              selected={new Date(signature.date)}
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
            {signature.members.map((m, j) => {
              return (
                <SignatureMember
                  key={j}
                  onChange={(key, value) => handleMemberChange(key, value, j)}
                  onDelete={canDelete ? () => handleDelete(j) : undefined}
                  {...m}
                />
              )
            })}
          </Stack>
          <Inline justifyContent="flexEnd">
            <Button
              icon="add"
              iconType="outline"
              size="small"
              onClick={() => handleAddMember()}
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
