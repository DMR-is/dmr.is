import { useFormContext } from 'react-hook-form'

import {
  ApplicationRequirementStatementEnum,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { getValues, watch } = useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { debouncedUpdateApplicationJson, updateApplicationJson } =
    useUpdateApplicationJson({
      id: metadata.applicationId,
      type: 'RECALL',
    })

  const recallRequirementStateLocation = watch(
    'fields.settlementFields.recallRequirementStatementType',
  )

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h4">Upplýsingar um skiptastjóra</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Nafn skiptastjóra"
          name={'fields.settlementFields.liquidatorName'}
          onChange={(val) =>
            debouncedUpdateApplicationJson({
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
            debouncedUpdateApplicationJson({
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
              updateApplicationJson({
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
