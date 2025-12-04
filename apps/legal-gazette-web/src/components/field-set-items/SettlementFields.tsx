'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AdvertTemplateType, SettlementDto } from '../../gen/fetch'
import { useUpdateSettlement } from '../../hooks/useUpdateSettlement'

type SettlementFieldsProps = {
  advertId: string
  canEdit: boolean
  settlement: SettlementDto
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
  } = useUpdateSettlement(advertId, settlement.id)

  return (
    <Stack space={[1, 2]}>
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
              label="Frestur til að gera kröfu"
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
              defaultValue={settlement.declaredClaims}
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
