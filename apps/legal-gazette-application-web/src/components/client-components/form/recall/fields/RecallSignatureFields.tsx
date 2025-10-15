import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  RecallFormFields,
  RecallFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSignatureFields = () => {
  const { getValues } = useFormContext<RecallFormSchema>()

  const { updateSignatureLocation, updateSignatureDate } = useUpdateApplication(
    getValues('meta.applicationId'),
  )

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Undirritun</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          required
          label="Dagsetning undirritunar"
          name={RecallFormFields.SIGNATURE_DATE}
          maxDate={new Date()}
          onChange={(date) => updateSignatureDate(date.toISOString())}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          required
          label="Staðsetning undirritunar"
          name={RecallFormFields.SIGNATURE_LOCATION}
          onBlur={(val) => updateSignatureLocation(val)}
        />
      </GridColumn>
    </GridRow>
  )
}
