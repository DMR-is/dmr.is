import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateBankruptcyApplication } from '../../../../../hooks/useUpdateBankruptcyApplication'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/forms/schemas/bankruptcy-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const BankruptcySettlementFields = () => {
  const { caseId, applicationId } =
    useFormContext<BankruptcyFormSchema>().getValues('meta')

  const { trigger } = useUpdateBankruptcyApplication({ caseId, applicationId })

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um þrotabúið</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_NAME}
          label="Nafn þrotabús"
          required
          onBlur={(val) => trigger({ settlementName: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_NATIONAL_ID}
          label="Kennitala þrotabús"
          required
          onBlur={(val) => trigger({ settlementNationalId: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_ADDRESS}
          label="Heimilisfang þrotabús"
          required
          onBlur={(val) => trigger({ settlementAddress: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          name={BankruptcyFormFields.SETTLEMENT_DEADLINE}
          label="Fresturdagur þrotabús"
          required
          onChange={(val) =>
            trigger({ settlementDeadline: val ? val.toISOString() : '' })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
