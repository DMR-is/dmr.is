'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import {
  isBankruptcyRecallAdvert,
  isDeceasedRecallAdvert,
  isDivisionEndingAdvert,
} from '../../../../lib/advert-type-guards'

export const SettlementFields = () => {
  const { advert } = useAdvertContext()

  const { trigger } = useUpdateAdvert(advert.id)

  if (!advert.settlement) {
    return null
  }

  const isDivisionEnding = isDivisionEndingAdvert(advert)
  const isBankruptcyRecall = isBankruptcyRecallAdvert(advert)
  const isDeceasedRecall = isDeceasedRecallAdvert(advert)

  const settlement = advert.settlement

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Upplýsingar um búið</Text>
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-liquidator-name"
            label="Skiptastjóri"
            value={settlement.liquidatorName}
          />
        </GridColumn>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-liquidator-location"
            label="Staðsetning skiptastjóra"
            value={settlement.liquidatorLocation}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-name"
            label="Heiti bús"
            value={settlement.settlementName}
          />
        </GridColumn>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-national-id"
            label="Kennitala bús"
            value={settlement.settlementNationalId}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement-address"
            label="Heimilisfang bús"
            value={settlement.settlementAddress}
          />
        </GridColumn>
        {isBankruptcyRecall && (
          <GridColumn span="6/12">
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
            />
          </GridColumn>
        )}
        {isDeceasedRecall && (
          <GridColumn span="6/12">
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
            />
          </GridColumn>
        )}
      </GridRow>
      <GridRow>
        {isDivisionEnding && (
          <GridColumn span="6/12">
            <Input
              name="declared-claims"
              size="sm"
              backgroundColor="blue"
              type="number"
              label="Lýstar kröfur"
              value={settlement.declaredClaims ?? undefined}
            />
          </GridColumn>
        )}
      </GridRow>
    </Stack>
  )
}
