'use client'

import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette-schemas'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { DatePickerController } from '../../../controllers/DatePickerController'
import { InputController } from '../../../controllers/InputController'
import { RecallSettlementDefault } from './RecallSettlementDefault'

export const RecallSettlementUndivided = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
    id: applicationId,
    type: 'RECALL',
  })

  return (
    <>
      <RecallSettlementDefault />
      <GridRow rowGap={[2, 3]} marginTop={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name="fields.settlementFields.partnerName"
            label="Nafn maka"
            onChange={(val) =>
              updateLocalOnly({
                fields: {
                  settlementFields: {
                    partnerName: val,
                  },
                },
              })
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name="fields.settlementFields.partnerNationalId"
            label="Kennitala maka"
            onChange={(val) =>
              updateLocalOnly({
                fields: {
                  settlementFields: {
                    partnerNationalId: val,
                  },
                },
              })
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name="fields.settlementFields.partnerDateOfDeath"
            maxDate={new Date()}
            minDate={undefined}
            label="Dánardagur maka"
            onChange={(val) =>
              updateLocalOnly({
                fields: {
                  settlementFields: {
                    partnerDateOfDeath: val.toISOString(),
                  },
                },
              })
            }
          />
        </GridColumn>
      </GridRow>
    </>
  )
}
