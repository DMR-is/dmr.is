import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { RecallTypeEnum } from '../../../../../gen/fetch'
import { useUpdateRecallApplication } from '../../../../../hooks/useUpdateRecallApplication'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

type Props = {
  applicationType: RecallTypeEnum
}

export const RecallSettlementFields = ({ applicationType }: Props) => {
  const { caseId, applicationId } =
    useFormContext<BankruptcyFormSchema>().getValues('meta')

  const title =
    applicationType === RecallTypeEnum.BANKRUPTCY
      ? 'Upplýsingar um þrotabúið'
      : 'Upplýsingar um dánarbúið'

  const type =
    applicationType === RecallTypeEnum.BANKRUPTCY ? 'þrotabús' : 'dánarbús'

  const { trigger } = useUpdateRecallApplication({ caseId, applicationId })

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">{title}</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_NAME}
          label={`Nafn ${type}`}
          required
          onBlur={(val) => trigger({ settlementName: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_NATIONAL_ID}
          label={`Kennitala ${type}`}
          required
          onBlur={(val) => trigger({ settlementNationalId: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={BankruptcyFormFields.SETTLEMENT_ADDRESS}
          label={
            applicationType === RecallTypeEnum.BANKRUPTCY
              ? 'Heimilisfang þrotabús'
              : 'Síðasta heimilisfang'
          }
          required
          onBlur={(val) => trigger({ settlementAddress: val })}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          name={
            applicationType === RecallTypeEnum.BANKRUPTCY
              ? BankruptcyFormFields.SETTLEMENT_DEADLINE
              : BankruptcyFormFields.SETTLEMENT_DATE_OF_DEATH
          }
          label={
            applicationType === RecallTypeEnum.BANKRUPTCY
              ? 'Frestdagur þrotabús'
              : 'Dánardagur'
          }
          required
          onChange={(val) => {
            if (applicationType === RecallTypeEnum.BANKRUPTCY) {
              return trigger({
                settlementDeadline: val ? val.toISOString() : '',
              })
            }

            return trigger({
              settlementDateOfDeath: val ? val.toISOString() : '',
            })
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
