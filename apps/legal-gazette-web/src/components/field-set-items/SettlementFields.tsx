'use client'

import { useState } from 'react'

import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import {
  AdvertTemplateType,
  ApplicationRequirementStatementEnum,
} from '../../gen/fetch'
import { useUpdateSettlement } from '../../hooks/useUpdateSettlement'
import { AdvertSettlement } from '../../lib/trpc/types'
import { requirementsStatementOptions } from '../create-advert/CreateBankruptcySettlement'

type SettlementFieldsProps = {
  advertId: string
  canEdit: boolean
  settlement: AdvertSettlement
  templateType: AdvertTemplateType
}

export const SettlementFields = ({
  advertId,
  canEdit,
  settlement,
  templateType,
}: SettlementFieldsProps) => {
  const {
    updateLiquidatorName,
    updateLiquidatorLocation,
    updateDeclaredClaims,
    updateSettlementAddress,
    updateSettlementDateOfDeath,
    updateSettlementDeadline,
    updateSettlementName,
    updateSettlementNationalId,
    updateRecallStatementType,
    updateRecallStatementLocation,
  } = useUpdateSettlement(advertId, settlement.id)

  // Determine initial value based on statement type
  const getInitialRecallStatementLocation = () => {
    if (
      settlement.liquidatorRecallStatementType ===
      ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
    ) {
      return settlement.liquidatorLocation || ''
    }
    // For CUSTOMLIQUIDATORLOCATION or CUSTOMLIQUIDATOREMAIL
    return settlement.liquidatorRecallStatementLocation || ''
  }

  const [recallStatementLocation, setRecallStatementLocation] = useState(
    getInitialRecallStatementLocation(),
  )

  const defaultRecallStatementType =
    requirementsStatementOptions?.find(
      (option) => option.value === settlement.liquidatorRecallStatementType,
    ) || null

  const handleChangeRecallStatementType = (
    opt: { label: string; value: ApplicationRequirementStatementEnum } | null,
  ) => {
    if (opt?.value) {
      updateRecallStatementType(opt.value)

      const newRecallStatementLocation =
        opt.value === ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
          ? settlement.liquidatorLocation
          : ''

      setRecallStatementLocation(newRecallStatementLocation)
      updateRecallStatementLocation(newRecallStatementLocation)
    }
  }

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-name"
            label="Heiti bús"
            defaultValue={settlement.name}
            onBlur={(evt) => updateSettlementName(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-national-id"
            label="Kennitala bús"
            defaultValue={settlement.nationalId}
            onBlur={(evt) => updateSettlementNationalId(evt.target.value)}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-address"
            label="Heimilisfang bús"
            defaultValue={settlement.address}
            onBlur={(evt) => updateSettlementAddress(evt.target.value)}
          />
        </GridColumn>

        {(templateType === AdvertTemplateType.RECALLBANKRUPTCY ||
          templateType === AdvertTemplateType.DIVISIONMEETINGBANKRUPTCY) && (
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              disabled={!canEdit}
              size="sm"
              placeholderText=""
              backgroundColor="blue"
              name="settlement-deadline"
              label="Frestdagur"
              locale="is"
              selected={
                settlement.deadline ? new Date(settlement.deadline) : undefined
              }
              handleChange={(date) => {
                updateSettlementDeadline(date.toISOString())
              }}
            />
          </GridColumn>
        )}

        {(templateType === AdvertTemplateType.RECALLDECEASED ||
          templateType === AdvertTemplateType.DIVISIONMEETINGDECEASED) && (
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              disabled={!canEdit}
              size="sm"
              placeholderText=""
              backgroundColor="blue"
              name="settlement-date-of-death"
              label="Dánardagur"
              locale="is"
              selected={
                settlement.dateOfDeath
                  ? new Date(settlement.dateOfDeath)
                  : undefined
              }
              handleChange={(date) => {
                updateSettlementDateOfDeath(date.toISOString())
              }}
            />
          </GridColumn>
        )}
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-liquidator-name"
            label="Skiptastjóri"
            defaultValue={settlement.liquidatorName}
            onBlur={(evt) => updateLiquidatorName(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-liquidator-location"
            label="Staðsetning skiptastjóra"
            defaultValue={settlement.liquidatorLocation}
            onBlur={(evt) => updateLiquidatorLocation(evt.target.value)}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            isDisabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            label="Kröfulýsing"
            value={defaultRecallStatementType}
            options={requirementsStatementOptions}
            onChange={(val) =>
              handleChangeRecallStatementType(
                val as {
                  label: string
                  value: ApplicationRequirementStatementEnum
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            name="settlement-liquidator-location"
            label={
              defaultRecallStatementType?.value ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
                ? 'Staðsetning skiptastjóra'
                : defaultRecallStatementType?.value ===
                    ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION
                  ? 'Innslegin staðsetning'
                  : 'Tölvupóstur'
            }
            value={recallStatementLocation}
            onChange={(evt) => setRecallStatementLocation(evt.target.value)}
            onBlur={(evt) => updateRecallStatementLocation(evt.target.value)}
            readOnly={
              defaultRecallStatementType?.value ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            }
          />
        </GridColumn>
      </GridRow>
      {templateType === AdvertTemplateType.DIVISIONENDING && (
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              disabled={!canEdit}
              name="declared-claims"
              size="sm"
              backgroundColor="blue"
              type="number"
              label="Lýstar kröfur"
              defaultValue={settlement.declaredClaims ?? undefined}
              onBlur={(evt) => {
                updateDeclaredClaims(Number(evt.target.value))
              }}
            />
          </GridColumn>
        </GridRow>
      )}
    </Stack>
  )
}
