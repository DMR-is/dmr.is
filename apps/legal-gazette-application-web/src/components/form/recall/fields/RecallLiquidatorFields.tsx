import { useFormContext } from 'react-hook-form'

import {
  ApplicationRequirementStatementEnum,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { getValues, watch } = useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
    id: metadata.applicationId,
    type: 'RECALL',
  })

  const recallRequirementStateLocation = watch(
    'fields.settlementFields.recallRequirementStatementType',
  )

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Nafn skiptastjóra"
          name={'fields.settlementFields.liquidatorName'}
          onChange={(val) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: {
                settlementFields: {
                  liquidatorName: val,
                },
              },
            })
          }
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          required
          label="Staðsetning skiptastjóra"
          name={'fields.settlementFields.liquidatorLocation'}
          onChange={(val) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: {
                settlementFields: {
                  liquidatorLocation: val,
                },
              },
            })
          }
          onBlur={(val) => {
            if (
              recallRequirementStateLocation ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            ) {
              // Also save the linked field to localStorage
              updateLocalOnly({
                fields: {
                  settlementFields: {
                    recallRequirementStatementLocation: val,
                  },
                },
              })
            }
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
