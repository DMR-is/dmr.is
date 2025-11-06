import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { getValues } = useFormContext<RecallApplicationSchema>()
  const { updateLiquidatorName, updateLiquidatorLocation } =
    useUpdateApplication(getValues('metadata.applicationId'))

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um skiptastjóra</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Nafn skiptastjóra"
          name={RecallApplicationInputFields.LIQUIDATOR_NAME}
          onBlur={(val) => updateLiquidatorName(val)}
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Staðsetning skiptastjóra"
          name={RecallApplicationInputFields.LIQUIDATOR_LOCATION}
          onBlur={(val) => updateLiquidatorLocation(val)}
          required
        />
      </GridColumn>
    </GridRow>
  )
}
