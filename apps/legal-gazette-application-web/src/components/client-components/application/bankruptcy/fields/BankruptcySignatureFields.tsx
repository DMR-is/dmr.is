import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateBankruptcyApplication } from '../../../../../hooks/useUpdateBankruptcyApplication'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/schemas'
import { DatePickerController } from '../../../controllers/DatePickerController'
import { InputController } from '../../../controllers/InputController'

export const BankruptcySignatureFields = () => {
  const { getValues } = useFormContext<BankruptcyFormSchema>()

  const { caseId, applicationId } = getValues('meta')
  const { trigger } = useUpdateBankruptcyApplication({ applicationId, caseId })

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
