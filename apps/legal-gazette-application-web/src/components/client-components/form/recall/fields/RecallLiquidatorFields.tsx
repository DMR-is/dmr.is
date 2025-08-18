import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateRecallApplication } from '../../../../../hooks/useUpdateRecallApplication'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { InputController } from '../../controllers/InputController'

export const RecallLiquidatorFields = () => {
  const { caseId, applicationId } =
    useFormContext<BankruptcyFormSchema>().getValues('meta')
  const { trigger } = useUpdateRecallApplication({ applicationId, caseId })

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um skiptastjóra</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Nafn skiptastjóra"
          name={BankruptcyFormFields.LIQUIDATOR_NAME}
          onBlur={(val) => trigger({ liquidator: val })}
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Staðsetning skiptastjóra"
          name={BankruptcyFormFields.LIQUIDATOR_LOCATION}
          onBlur={(val) => trigger({ liquidatorLocation: val })}
          required
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label="Fyrir hönd skiptastjóra"
          name={BankruptcyFormFields.LIQUIDATOR_ON_BEHALF_OF}
          onBlur={(val) => trigger({ liquidatorOnBehalfOf: val })}
        />
      </GridColumn>
    </GridRow>
  )
}
