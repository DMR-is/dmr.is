'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { SettlementDto } from '../../gen/fetch'
import { useUpdateSettlement } from '../../hooks/useUpdateSettlement'

type SettlementFieldsProps = {
  advertId: string
  settlement: SettlementDto
  isBankruptcyRecall?: boolean
  isDeceasedRecall?: boolean
  isDivisionEnding?: boolean
}

export const SettlementFields = ({
  advertId,
  settlement,
  isBankruptcyRecall,
  isDeceasedRecall,
  isDivisionEnding,
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
  } = useUpdateSettlement(advertId, settlement.id)

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
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
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-name"
            label="Heiti bús"
            defaultValue={settlement.settlementName}
            onBlur={(evt) => updateSettlementName(evt.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-national-id"
            label="Kennitala bús"
            defaultValue={settlement.settlementNationalId}
            onBlur={(evt) => updateSettlementNationalId(evt.target.value)}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-address"
            label="Heimilisfang bús"
            defaultValue={settlement.settlementAddress}
            onBlur={(evt) => updateSettlementAddress(evt.target.value)}
          />
        </GridColumn>
        {isBankruptcyRecall && (
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              size="sm"
              placeholderText=""
              backgroundColor="blue"
              name="settlement-deadline"
              label="Frestur til að gera kröfu"
              locale="is"
              selected={
                settlement.settlementDeadline
                  ? new Date(settlement.settlementDeadline)
                  : undefined
              }
              handleChange={(date) => {
                updateSettlementDeadline(date.toISOString())
              }}
            />
          </GridColumn>
        )}
        {isDeceasedRecall && (
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              size="sm"
              placeholderText=""
              backgroundColor="blue"
              name="settlement-date-of-death"
              label="Dánardagur"
              locale="is"
              selected={
                settlement.settlementDateOfDeath
                  ? new Date(settlement.settlementDateOfDeath)
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
        {isDivisionEnding && (
          <GridColumn span={['12/12', '6/12']}>
            <Input
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
        )}
      </GridRow>
    </Stack>
  )
}
