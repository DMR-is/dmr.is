import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { ApplicationRequirementStatementEnum } from '../../../../gen/fetch'
import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { requirementsStatementOptions } from '../../../../lib/constants'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallRequirementStatementFields = () => {
  const { getValues, setValue, watch } =
    useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { updateApplication, debouncedUpdateApplication } =
    useUpdateApplication({
      id: metadata.applicationId,
      type: 'RECALL',
    })

  const liquidatorLocation = watch('fields.settlementFields.liquidatorLocation')

  const customLiquidatorType = watch(
    'fields.settlementFields.recallRequirementStatementType',
  )

  const recallRequirementStatementType = watch(
    'fields.settlementFields.recallRequirementStatementType',
  )

  useEffect(() => {
    if (
      customLiquidatorType !==
      ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
    )
      return

    setValue(
      'fields.settlementFields.recallRequirementStatementLocation',
      liquidatorLocation,
    )
  }, [liquidatorLocation, customLiquidatorType, setValue])

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h4">Hvert skal senda kröfulýsingar</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <SelectController
          options={requirementsStatementOptions}
          name={'fields.settlementFields.recallRequirementStatementType'}
          label="Kröfulýsingar"
          required
          onChange={(val) => {
            updateApplication(
              {
                fields: {
                  settlementFields: {
                    recallRequirementStatementType:
                      val as ApplicationRequirementStatementEnum,
                  },
                },
              },
              {
                successMessage: 'Val á kröfulýsingu vistað',
                errorMessage: 'Ekki tókst að vista val á kröfulýsingu',
              },
            )
            if (
              val === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            ) {
              setValue(
                'fields.settlementFields.recallRequirementStatementLocation',
                liquidatorLocation,
              )
            } else {
              setValue(
                'fields.settlementFields.recallRequirementStatementLocation',
                '',
              )
            }
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          key={recallRequirementStatementType}
          name={'fields.settlementFields.recallRequirementStatementLocation'}
          label={
            recallRequirementStatementType ===
            ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
              ? 'Staðsetning skiptastjóra'
              : recallRequirementStatementType ===
                  ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION
                ? 'Innslegin staðsetning'
                : 'Tölvupóstur'
          }
          onChange={(val) =>
            debouncedUpdateApplication(
              {
                fields: {
                  settlementFields: {
                    recallRequirementStatementLocation: val,
                  },
                },
              },
              {
                successMessage: 'Staðsetning skiptastjóra vistuð',
                errorMessage: 'Ekki tókst að vista staðsetningu skiptastjóra',
              },
            )
          }
          readonly={
            recallRequirementStatementType ===
            ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
          }
        />
      </GridColumn>
    </GridRow>
  )
}
