'use client'

import useSWRMutation from 'swr/mutation'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AccordionItem, toast } from '@island.is/island-ui/core'

import { UpdateSettlementDto } from '../../../../gen/fetch'
import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useClient } from '../../../../hooks/useClient'
import {
  isBankruptcyRecallAdvert,
  isDeceasedRecallAdvert,
  isDivisionEndingAdvert,
} from '../../../../lib/advert-type-guards'

type SettlementAccordionItemProps = {
  expanded: boolean
  onToggle: () => void
}

export const SettlementAccordionItem = ({
  expanded,
  onToggle,
}: SettlementAccordionItemProps) => {
  const { advert } = useAdvertContext()

  const client = useClient('SettlementApi')

  const { trigger } = useSWRMutation(
    advert.settlement?.id ? ['updateSettlement', advert.settlement.id] : null,
    ([_key, id], { arg }: { arg: UpdateSettlementDto }) =>
      client.updateSettlement({
        id,
        updateSettlementDto: arg,
      }),
  )

  if (!advert.settlement) {
    return null
  }

  const isDivisionEnding = isDivisionEndingAdvert(advert)
  const isBankruptcyRecall = isBankruptcyRecallAdvert(advert)
  const isDeceasedRecall = isDeceasedRecallAdvert(advert)

  const settlement = advert.settlement

  return (
    <AccordionItem
      id="settlement"
      label="Upplýsingar um búið"
      labelVariant="h5"
      iconVariant="small"
      expanded={expanded}
      onToggle={onToggle}
    >
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              name="settlement-liquidator-name"
              label="Skiptastjóri"
              defaultValue={settlement.liquidatorName}
              onBlur={(evt) =>
                trigger(
                  { liquidatorName: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Skiptastjóri uppfærður')
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra skiptastjóra')
                    },
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              name="settlement-liquidator-location"
              label="Staðsetning skiptastjóra"
              defaultValue={settlement.liquidatorLocation}
              onBlur={(evt) =>
                trigger(
                  { liquidatorLocation: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Staðsetning skiptastjóra uppfærð')
                    },
                    onError: () => {
                      toast.error(
                        'Ekki tókst að uppfæra staðsetningu skiptastjóra',
                      )
                    },
                  },
                )
              }
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
              onBlur={(evt) =>
                trigger(
                  { settlementName: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Heiti bús uppfært')
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra heiti bús')
                    },
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              name="settlement-national-id"
              label="Kennitala bús"
              defaultValue={settlement.settlementNationalId}
              onBlur={(evt) =>
                trigger(
                  { settlementNationalId: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Kennitala bús uppfærð')
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra kennitölu bús')
                    },
                  },
                )
              }
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
              onBlur={(evt) =>
                trigger(
                  { settlementAddress: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Heimilisfang bús uppfært')
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra heimilisfang bús')
                    },
                  },
                )
              }
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
                  trigger(
                    { settlementDeadline: date.toISOString() },
                    {
                      onSuccess: () => {
                        toast.success('Frestur til að gera kröfu uppfærður')
                      },
                      onError: () => {
                        toast.error(
                          'Ekki tókst að uppfæra frest til að gera kröfu',
                        )
                      },
                    },
                  )
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
                  trigger(
                    { settlementDateOfDeath: date.toISOString() },
                    {
                      onSuccess: () => {
                        toast.success('Dánardagur uppfærður')
                      },
                      onError: () => {
                        toast.error('Ekki tókst að uppfæra dánardag')
                      },
                    },
                  )
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
                value={settlement.declaredClaims ?? undefined}
                onBlur={(evt) => {
                  try {
                    parseInt(evt.target.value)
                  } catch (_error) {
                    return toast.error('Lýstar kröfur verða að vera tala')
                  }
                  return trigger(
                    {
                      declaredClaims: Number(evt.target.value),
                    },
                    {
                      onSuccess: () => {
                        toast.success('Lýstar kröfur uppfærðar')
                      },
                      onError: () => {
                        toast.error('Ekki tókst að uppfæra lýstar kröfur')
                      },
                    },
                  )
                }}
              />
            </GridColumn>
          )}
        </GridRow>
      </Stack>
    </AccordionItem>
  )
}
