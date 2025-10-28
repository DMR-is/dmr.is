'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'

type SignatureFieldsProps = {
  id: string
  canEdit: boolean
  signatureName?: string
  signatureOnBehalfOf?: string
  signatureLocation?: string
  signatureDate?: Date
}

export const SignatureFields = ({
  id,
  canEdit,
  signatureName = '',
  signatureLocation = '',
  signatureOnBehalfOf = '',
  signatureDate,
}: SignatureFieldsProps) => {
  const {
    updateSignatureName,
    updateSignatureOnBehalfOf,
    updateSignatureLocation,
    updateSignatureDate,
    isUpdatingAdvert,
  } = useUpdateAdvert(id)

  const isDisabled = !canEdit || isUpdatingAdvert

  return (
    <Stack space={[1, 2]}>
      <GridRow rowGap={[1, 2]}>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={isDisabled}
            name="signatureName"
            backgroundColor="blue"
            size="sm"
            label="Nafn undirritara"
            defaultValue={signatureName}
            onBlur={(evt) => updateSignatureName(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureOnBehalfOf"
            backgroundColor="blue"
            size="sm"
            label="Fyrir hönd"
            defaultValue={signatureOnBehalfOf ?? ''}
            disabled={isDisabled}
            onBlur={(evt) => updateSignatureOnBehalfOf(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureLocation"
            backgroundColor="blue"
            size="sm"
            label="Staður undirritunar"
            defaultValue={signatureLocation}
            disabled={isDisabled}
            onBlur={(evt) => updateSignatureLocation(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            name="signatureDate"
            backgroundColor="blue"
            locale="is"
            placeholderText=""
            size="sm"
            label="Dagsetning undirritunar"
            selected={signatureDate}
            disabled={isDisabled}
            handleChange={(date) =>
              updateSignatureDate(date?.toISOString() || '')
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
