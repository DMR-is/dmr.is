import { useFormContext } from 'react-hook-form'

import {
  ApplicationInputFields,
  BaseApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { DatePickerController } from '../controllers/DatePickerController'
import { InputController } from '../controllers/InputController'

export const SignatureFields = () => {
  const { getValues } = useFormContext<BaseApplicationSchema>()
  const {
    updateSignatureName,
    updateSignatureLocation,
    updateSignatureDate,
    updateSignatureOnBehalfOf,
  } = useUpdateApplication(getValues('metadata.applicationId'))

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Undirritun</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={ApplicationInputFields.SIGNATURE_NAME}
            label="Nafn undirritara"
            onBlur={(val) => updateSignatureName(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={ApplicationInputFields.SIGNATURE_LOCATION}
            label="Staðsetning undirritara"
            onBlur={(val) => updateSignatureLocation(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={ApplicationInputFields.SIGNATURE_ON_BEHALF_OF}
            label="F.h. undirritara"
            onBlur={(val) => updateSignatureOnBehalfOf(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name={ApplicationInputFields.SIGNATURE_DATE}
            label="Dagsetning undirritunar"
            onChange={(date) => updateSignatureDate(date.toISOString())}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
