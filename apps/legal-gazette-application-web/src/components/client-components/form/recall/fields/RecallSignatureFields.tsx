import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSignatureFields = () => {
  const { getValues } = useFormContext<BankruptcyFormSchema>()

  const { applicationId } = getValues('meta')
  const { trigger } = useUpdateApplication({ applicationId })

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Undirritun</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          required
          label="Dagsetning undirritunar"
          name={BankruptcyFormFields.SIGNATURE_DATE}
          maxDate={new Date()}
          onChange={(date) => trigger({ signatureDate: date.toISOString() })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          required
          label="Staðsetning undirritunar"
          name={BankruptcyFormFields.SIGNATURE_LOCATION}
          onBlur={(val) => trigger({ signatureLocation: val })}
        />
      </GridColumn>
    </GridRow>
  )
}
