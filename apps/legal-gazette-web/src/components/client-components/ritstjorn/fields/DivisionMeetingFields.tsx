'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AccordionItem, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import {
  isBankruptcyRecallAdvert,
  isDivisionMeetingAdvert,
} from '../../../../lib/advert-type-guards'

export const DivisionMeetingFields = () => {
  const { advert } = useAdvertContext()
  const { trigger } = useUpdateAdvert(advert.id)

  const isBankruptcyRecall = isBankruptcyRecallAdvert(advert)
  const isDivisionMeeting = isDivisionMeetingAdvert(advert)
  const isBankruptcyOrDivisionMeeting = isBankruptcyRecall || isDivisionMeeting

  if (!isBankruptcyOrDivisionMeeting) {
    return null
  }

  return (
    <AccordionItem id="division" label="Upplýsingar um skiptafund">
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              name="division-meeting-location"
              label="Staðsetning skiptafundar"
              size="sm"
              backgroundColor="blue"
              defaultValue={advert.divisionMeetingLocation}
              onBlur={(event) =>
                trigger(
                  {
                    divisionMeetingLocation: event.target.value,
                  },
                  {
                    onSuccess: () => {
                      toast.success('Staðsetning skiptafundar vistað')
                    },
                    onError: () => {
                      toast.error(
                        'Ekki tókst að vista staðsetningu skiptafundar',
                      )
                    },
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              size="sm"
              backgroundColor="blue"
              locale="is"
              label="Dagsetning skiptafundar"
              placeholderText=""
              selected={
                advert.divisionMeetingDate
                  ? new Date(advert.divisionMeetingDate)
                  : null
              }
              handleChange={(date) =>
                trigger(
                  {
                    divisionMeetingDate: date.toISOString(),
                  },
                  {
                    onSuccess: () => {
                      toast.success('Dagsetning skiptafundar vistuð')
                    },
                    onError: () => {
                      toast.error(
                        'Ekki tókst að vista dagsetningu skiptafundar',
                      )
                    },
                  },
                )
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </AccordionItem>
  )
}
