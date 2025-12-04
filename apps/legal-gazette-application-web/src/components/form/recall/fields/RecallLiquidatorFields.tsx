import { useFormContext } from 'react-hook-form'

import {
  ApplicationRequirementStatementEnum,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { getValues, watch } = useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { debouncedUpdateApplication, updateApplication } =
    useUpdateApplication({
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
            debouncedUpdateApplication(
              {
                fields: {
                  settlementFields: {
                    liquidatorName: val,
                  },
                },
              },
              {
                successMessage: 'Nafn skiptastjóra vistað',
                errorMessage: 'Ekki tókst að vista nafn skiptastjóra',
              },
            )
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
            debouncedUpdateApplication(
              {
                fields: {
                  settlementFields: {
                    liquidatorLocation: val,
                  },
                },
              },
              {
                successMessage: 'Staðsetning skiptastjóra vistuð',
                errorMessage: 'Ekki tókst að vista staðsetningu skiptastjóra',
              },
            )
          }
          onBlur={(val) => {
            if (
              recallRequirementStateLocation ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            ) {
              updateApplication(
                {
                  fields: {
                    settlementFields: {
                      recallRequirementStatementLocation: val,
                    },
                  },
                },
                {
                  successMessage: 'Staðsetning skiptastjóra ',
                  errorMessage: 'Ekki tókst að vista staðsetningu skiptastjóra',
                },
              )
            }
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
