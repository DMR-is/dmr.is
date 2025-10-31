import subDays from 'date-fns/subDays'
import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { POSTPONE_LIMIT } from '../../../../../lib/constants'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSettlementFields = () => {
  const { getValues } = useFormContext<RecallApplicationSchema>()
  const { type } = getValues('fields')

  const title =
    type === 'RECALL_BANKRUPTCY'
      ? 'Upplýsingar um þrotabúið'
      : 'Upplýsingar um dánarbúið'

  const settlementType = type === 'RECALL_BANKRUPTCY' ? 'þrotabús' : 'dánarbús'

  const {
    updateSettlementName,
    updateSettlementDateOfDeath,
    updateSettlementDeadlineDate,
    updateSettlementAddress,
    updateSettlementNationalId,
  } = useUpdateApplication(getValues('metadata.applicationId'))

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">{title}</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallApplicationInputFields.SETTLEMENT_NAME}
          label={`Nafn ${settlementType}`}
          required
          onBlur={(val) => updateSettlementName(val)}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallApplicationInputFields.SETTLEMENT_NATIONAL_ID}
          label={`Kennitala ${settlementType}`}
          required
          onBlur={(val) => updateSettlementNationalId(val)}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallApplicationInputFields.SETTLEMENT_ADDRESS}
          label={
            settlementType === 'þrotabús'
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
            type === 'RECALL_BANKRUPTCY'
              ? RecallApplicationInputFields.SETTLEMENT_DEADLINE_DATE
              : RecallApplicationInputFields.SETTLEMENT_DATE_OF_DEATH
          }
          maxDate={type === 'RECALL_BANKRUPTCY' ? new Date() : undefined}
          minDate={
            type === 'RECALL_BANKRUPTCY'
              ? subDays(new Date(), POSTPONE_LIMIT)
              : undefined
          }
          label={
            type === 'RECALL_BANKRUPTCY' ? 'Frestdagur þrotabús' : 'Dánardagur'
          }
          required
          onChange={(val) => {
            if (type === 'RECALL_BANKRUPTCY') {
              return updateSettlementDeadlineDate(val.toISOString())
            }

            return updateSettlementDateOfDeath(val.toISOString())
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
