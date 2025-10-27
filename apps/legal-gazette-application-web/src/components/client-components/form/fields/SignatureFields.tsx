import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import {
  CommonFormFields,
  CommonFormSchema,
} from '../../../../lib/forms/schemas/common-schema'
import { RecallFormSchema } from '../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../controllers/DatePickerController'
import { InputController } from '../controllers/InputController'

export const SignatureFields = () => {
  const { getValues } = useFormContext<CommonFormSchema | RecallFormSchema>()
  const {
    updateSignatureName,
    updateSignatureLocation,
    updateSignatureDate,
    updateSignatureOnBehalfOf,
  } = useUpdateApplication(getValues('meta.applicationId'))

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Undirritun</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={CommonFormFields.SIGNATURE_NAME}
            label="Nafn undirritara"
            onBlur={(val) => updateSignatureName(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={CommonFormFields.SIGNATURE_LOCATION}
            label="Staðsetning undirritara"
            onBlur={(val) => updateSignatureLocation(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name={CommonFormFields.SIGNATURE_ON_BEHALF_OF}
            label="F.h. undirritara"
            onBlur={(val) => updateSignatureOnBehalfOf(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name={CommonFormFields.SIGNATURE_DATE}
            label="Dagsetning undirritunar"
            onChange={(date) => updateSignatureDate(date.toISOString())}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
