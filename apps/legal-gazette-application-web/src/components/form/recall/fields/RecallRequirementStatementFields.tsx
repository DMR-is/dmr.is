'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationRequirementStatementEnum,
  getRequirementStatementLocationLabel,
  RecallApplicationWebSchema,
  requirementsStatementOptions,
} from '@dmr.is/legal-gazette-schemas'
import { GridColumn} from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallRequirementStatementFields = () => {
  const { getValues, setValue, watch } =
    useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
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
    ) {
      return
    }

    setValue(
      'fields.settlementFields.recallRequirementStatementLocation',
      liquidatorLocation,
    )
  }, [liquidatorLocation, customLiquidatorType, setValue])

  const onChangeStatementType = (
    statementType: ApplicationRequirementStatementEnum,
  ) => {
    const location =
      statementType === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
        ? liquidatorLocation
        : ''

    setValue(
      'fields.settlementFields.recallRequirementStatementLocation',
      location,
    )

    updateLocalOnly({
      fields: {
        settlementFields: {
          recallRequirementStatementType: statementType,
          recallRequirementStatementLocation: location,
        },
      },
    })
  }

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span={['12/12', '6/12']}>
        <SelectController
          options={requirementsStatementOptions}
          name={'fields.settlementFields.recallRequirementStatementType'}
          label="Kröfulýsingar"
          required
          onChange={(val) =>
            onChangeStatementType(val as ApplicationRequirementStatementEnum)
          }
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          key={recallRequirementStatementType}
          name={'fields.settlementFields.recallRequirementStatementLocation'}
          required
          label={getRequirementStatementLocationLabel(
            recallRequirementStatementType,
          )}
          onChange={(val) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: {
                settlementFields: {
                  recallRequirementStatementLocation: val,
                },
              },
            })
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
