import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { ApplicationRequirementStatementEnum } from '../../../../gen/fetch'
import { useUpdateRecallApplication } from '../../../../hooks/useUpdateRecallApplication'
import { requirementsStatementOptions } from '../../../../lib/constants'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallRequirementStatementFields = () => {
  const { getValues, setValue, watch } =
    useFormContext<RecallApplicationSchema>()
  const {
    updateLiquidatorRecallRequirementStatementType,
    updateLiquidatorRecallRequirementStatementLocation,
  } = useUpdateRecallApplication(getValues('metadata.applicationId'))

  useEffect(() => {
    const liquidatorLocation = watch(
      RecallApplicationInputFields.LIQUIDATOR_LOCATION,
    )
    const customLiquidatorType = getValues(
      RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_TYPE,
    )

    if (
      customLiquidatorType !==
      ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
    )
      return

    setValue(
      RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_LOCATION,
      liquidatorLocation,
    )
  }, [watch(RecallApplicationInputFields.LIQUIDATOR_LOCATION)])

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Hvert skal senda kröfulýsingar</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <SelectController
          options={requirementsStatementOptions}
          name={RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_TYPE}
          label="Kröfulýsingar"
          required
          onChange={(val) => {
            updateLiquidatorRecallRequirementStatementType(
              val as ApplicationRequirementStatementEnum,
            )
            if (
              val === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            ) {
              const liquidatorLocation = getValues(
                RecallApplicationInputFields.LIQUIDATOR_LOCATION,
              )
              setValue(
                RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_LOCATION,
                liquidatorLocation,
              )
            } else {
              setValue(
                RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_LOCATION,
                '',
              )
            }
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          label={
            getValues(
              RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_TYPE,
            ) === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
              ? 'Staðsetning skiptastjóra'
              : getValues(
                    RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_TYPE,
                  ) ===
                  ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION
                ? 'Innslegin staðsetning'
                : 'Tölvupóstur'
          }
          key={getValues(
            'fields.liquidatorFields.recallRequirementStatementType',
          )}
          name={
            RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_LOCATION
          }
          onBlur={(val) =>
            updateLiquidatorRecallRequirementStatementLocation(val)
          }
          readonly={
            getValues(
              RecallApplicationInputFields.RECALL_REQUIREMENT_STATEMENT_TYPE,
            ) === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
          }
        />
      </GridColumn>
    </GridRow>
  )
}
