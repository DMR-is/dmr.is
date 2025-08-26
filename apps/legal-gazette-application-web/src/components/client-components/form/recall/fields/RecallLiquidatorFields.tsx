import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  RecallFormFields,
  RecallFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { applicationId } = useFormContext<RecallFormSchema>().getValues('meta')
  const { trigger } = useUpdateApplication({ applicationId })

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um skiptastjóra</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Nafn skiptastjóra"
          name={RecallFormFields.LIQUIDATOR_NAME}
          onBlur={(val) => trigger({ liquidatorName: val })}
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Staðsetning skiptastjóra"
          name={RecallFormFields.LIQUIDATOR_LOCATION}
          onBlur={(val) => trigger({ liquidatorLocation: val })}
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Fyrir hönd skiptastjóra"
          name={RecallFormFields.LIQUIDATOR_ON_BEHALF_OF}
          onBlur={(val) => trigger({ liquidatorOnBehalfOf: val })}
        />
      </GridColumn>
    </GridRow>
  )
}
