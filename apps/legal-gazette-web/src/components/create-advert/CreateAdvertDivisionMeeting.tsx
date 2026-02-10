import { useState } from 'react'
import * as z from 'zod'

import { divisionMeetingSchemaRefined } from '@dmr.is/legal-gazette/schemas'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type DivisonMeeting = z.infer<typeof divisionMeetingSchemaRefined>

type Props = {
  required?: boolean
  onChange: (data: DivisonMeeting) => void
}

const initalState: DivisonMeeting = {
  meetingDate: '',
  meetingLocation: '',
}

export const CreateAdvertDivisionMeeting = ({ required, onChange }: Props) => {
  const [state, setState] = useState(initalState)

  return (
    <>
      <GridColumn span="12/12">
        <Text variant="h4">Skiptafundur</Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <Input
          size="sm"
          backgroundColor="blue"
          label="Staðsetning skiptafundar"
          name="meetingLocation"
          value={state.meetingLocation}
          onChange={(e) => {
            setState((prev) => ({ ...prev, meetingLocation: e.target.value }))
            onChange({ ...state, meetingLocation: e.target.value })
          }}
          required={required}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePicker
          locale="is"
          backgroundColor="blue"
          size="sm"
          label="Dagsetning skiptafundar"
          name="meetingDate"
          showTimeInput
          handleChange={(date) => {
            setState((prev) => ({ ...prev, meetingDate: date.toISOString() }))
            onChange({ ...state, meetingDate: date.toISOString() })
          }}
          required={required}
          placeholderText={undefined}
        />
      </GridColumn>
    </>
  )
}
