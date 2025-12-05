'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { SignatureDto } from '../../gen/fetch'
import { useUpdateSignature } from '../../hooks/useUpdateSignature'

type SignatureFieldsProps = {
  signature: SignatureDto
  canEdit: boolean
}

export const SignatureFields = ({
  signature,
  canEdit,
}: SignatureFieldsProps) => {
  const {
    updateSignatureName,
    updateSignatureOnBehalfOf,
    updateSignatureLocation,
    updateSignatureDate,
    isUpdating,
  } = useUpdateSignature({
    advertId: signature.advertId,
    signatureId: signature.id,
  })

  const isDisabled = isUpdating || !canEdit

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
            defaultValue={signature.name}
            onBlur={(evt) => updateSignatureName(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureOnBehalfOf"
            backgroundColor="blue"
            size="sm"
            label="Fyrir hönd"
            defaultValue={signature.onBehalfOf}
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
            defaultValue={signature.location}
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
            selected={signature.date ? new Date(signature.date) : null}
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
