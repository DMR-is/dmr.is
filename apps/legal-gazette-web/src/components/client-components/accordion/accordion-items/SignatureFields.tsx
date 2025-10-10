'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'

type SignatureFieldsProps = {
  id: string
  signatureName: string
  signatureOnBehalfOf?: string
  signatureLocation: string
  signatureDate: string
}

export const SignatureFields = ({
  id,
  signatureName,
  signatureDate,
  signatureLocation,
  signatureOnBehalfOf,
}: SignatureFieldsProps) => {
  const {
    updateSignatureName,
    updateSignatureOnBehalfOf,
    updateSignatureLocation,
    updateSignatureDate,
    isUpdatingAdvert,
  } = useUpdateAdvert(id)

  return (
    <Stack space={[1, 2]}>
      <GridRow rowGap={[1, 2]}>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureName"
            backgroundColor="blue"
            size="sm"
            label="Nafn undirritara"
            defaultValue={signatureName}
            disabled={isUpdatingAdvert}
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
            disabled={isUpdatingAdvert}
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
            disabled={isUpdatingAdvert}
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
            selected={new Date(signatureDate)}
            disabled={isUpdatingAdvert}
            handleChange={(date) =>
              updateSignatureDate(date?.toISOString() || '')
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
