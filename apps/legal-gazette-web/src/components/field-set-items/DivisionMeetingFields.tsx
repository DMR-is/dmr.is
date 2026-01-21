'use client'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { DatePicker } from '@island.is/island-ui/core'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'

type DivisionMeetingFieldsProps = {
  id: string
  canEdit: boolean
  divisionMeetingLocation: string
  divisionMeetingDate: string
}

export const DivisionMeetingFields = ({
  id,
  canEdit,
  divisionMeetingLocation,
  divisionMeetingDate,
}: DivisionMeetingFieldsProps) => {
  const { updateDivisionMeetingLocation, updateDivisionMeetingDate } =
    useUpdateAdvert(id)

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            disabled={!canEdit}
            name="division-meeting-location"
            label="Staðsetning skiptafundar"
            size="sm"
            backgroundColor="blue"
            defaultValue={divisionMeetingLocation}
            onBlur={(event) =>
              updateDivisionMeetingLocation(event.target.value)
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            disabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            locale="is"
            label="Dagsetning skiptafundar"
            showTimeInput
            placeholderText=""
            selected={
              divisionMeetingDate ? new Date(divisionMeetingDate) : null
            }
            handleChange={(date) =>
              updateDivisionMeetingDate(date.toISOString())
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
