import subDays from 'date-fns/subDays'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { POSTPONE_LIMIT } from '../../../../lib/constants'
import {
  NationalIdLookup,
  NationalIdLookupResults,
} from '../../../national-id-lookup/NationalIdLookup'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSettlementFields = () => {
  const { getValues, setValue } = useFormContext<RecallApplicationSchema>()
  const { type } = getValues('fields')

  const title =
    type === 'RECALL_BANKRUPTCY'
      ? 'Upplýsingar um þrotabúið'
      : 'Upplýsingar um dánarbúið'

  const settlementType = type === 'RECALL_BANKRUPTCY' ? 'þrotabús' : 'dánarbús'

  const {
    updateApplication,
    updateSettlementDeadlineDate,
    updateSettlementDateOfDeath,
  } = useUpdateApplication(getValues('metadata.applicationId'))

  const [onLookupError, setOnLookupError] = useState<{
    title: string
    message: string
  } | null>(null)

  const onSuccessfulLookup = ({
    address,
    name,
    city,
    nationalId,
    zipCode,
  }: NationalIdLookupResults) => {
    setValue(RecallApplicationInputFields.SETTLEMENT_NAME, name)
    setValue(
      RecallApplicationInputFields.SETTLEMENT_ADDRESS,
      `${address}, ${zipCode} ${city}`,
    )
    setValue(RecallApplicationInputFields.SETTLEMENT_NATIONAL_ID, nationalId)
    updateApplication({
      recallFields: {
        settlementFields: {
          name: name,
          address: `${address}, ${zipCode} ${city}`,
          nationalId: nationalId,
        },
      },
    })
  }

  const resetLookupFields = () => {
    setValue(RecallApplicationInputFields.SETTLEMENT_NAME, '')
    setValue(RecallApplicationInputFields.SETTLEMENT_ADDRESS, '')
    setValue(RecallApplicationInputFields.SETTLEMENT_NATIONAL_ID, '')
    updateApplication({
      recallFields: {
        settlementFields: {
          name: '',
          address: '',
          nationalId: '',
        },
      },
    })
  }

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">{title}</Text>
      </GridColumn>
      {onLookupError && (
        <GridColumn span="12/12">
          <AlertMessage type="error" {...onLookupError} />
        </GridColumn>
      )}
      <GridColumn span={['12/12', '6/12']}>
        <NationalIdLookup
          defaultValue={getValues('fields.settlementFields.nationalId')}
          onSuccessfulLookup={onSuccessfulLookup}
          onReset={resetLookupFields}
          onError={setOnLookupError}
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
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name={RecallApplicationInputFields.SETTLEMENT_NAME}
          label={`Nafn ${settlementType}`}
          required
          readonly={true}
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
          readonly={true}
        />
      </GridColumn>
    </GridRow>
  )
}
