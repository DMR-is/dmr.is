import subDays from 'date-fns/subDays'
import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { POSTPONE_LIMIT } from '../../../../../lib/constants'
import {
  RecallFormFields,
  RecallFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSettlementFields = () => {
  const { getValues } = useFormContext<RecallFormSchema>()
  const { recallType: applicationType } = getValues('fields')

  const title =
    applicationType === 'bankruptcy'
      ? 'Upplýsingar um þrotabúið'
      : 'Upplýsingar um dánarbúið'

  const type = applicationType === 'bankruptcy' ? 'þrotabús' : 'dánarbús'

  const {
    updateSettlementName,
    updateSettlementDateOfDeath,
    updateSettlementDeadlineDate,
    updateSettlementAddress,
    updateSettlementNationalId,
  } = useUpdateApplication(getValues('meta.applicationId'))

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">{title}</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallFormFields.SETTLEMENT_NAME}
          label={`Nafn ${type}`}
          required
          onBlur={(val) => updateSettlementName(val)}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallFormFields.SETTLEMENT_NATIONAL_ID}
          label={`Kennitala ${type}`}
          required
          onBlur={(val) => updateSettlementNationalId(val)}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallFormFields.SETTLEMENT_ADDRESS}
          label={
            applicationType === 'bankruptcy'
              ? 'Heimilisfang þrotabús'
              : 'Síðasta heimilisfang'
          }
          required
          onBlur={(val) => updateSettlementAddress(val)}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          name={
            applicationType === 'bankruptcy'
              ? RecallFormFields.SETTLEMENT_DEADLINE
              : RecallFormFields.SETTLEMENT_DATE_OF_DEATH
          }
          maxDate={applicationType === 'bankruptcy' ? new Date() : undefined}
          minDate={
            applicationType === 'bankruptcy'
              ? subDays(new Date(), POSTPONE_LIMIT)
              : undefined
          }
          label={
            applicationType === 'bankruptcy'
              ? 'Frestdagur þrotabús'
              : 'Dánardagur'
          }
          required
          onChange={(val) => {
            if (applicationType === 'bankruptcy') {
              return updateSettlementDeadlineDate(val.toISOString())
            }

            return updateSettlementDateOfDeath(val.toISOString())
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
