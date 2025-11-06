import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationInputFields,
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { ONE_WEEK, TWO_WEEKS } from '../../../../../lib/constants'
import { getNextWeekday, getWeekendDays } from '../../../../../lib/utils'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

type Props = {
  required?: boolean
}

export const RecallDivisionFields = ({ required = true }: Props) => {
  const {
    getValues,
    setValue,
    watch,
    formState: { isReady, dirtyFields },
  } = useFormContext<RecallApplicationSchema>()
  const { applicationId } = getValues('metadata')

  const recallDates = watch(ApplicationInputFields.PUBLISHING_DATES)

  useEffect(() => {
    if (isReady && dirtyFields.publishingDates) {
      setValue(ApplicationInputFields.PUBLISHING_DATES, [])

      updateDivisionMeetingDate(null)
    }
  }, [recallDates, isReady, dirtyFields])

  const { updateDivisionMeetingDate, updateDivisionMeetingLocation } =
    useUpdateApplication(applicationId)

  const minDate = recallDates?.length
    ? addDays(
        new Date(recallDates[recallDates.length - 1].publishingDate),
        ONE_WEEK * 9,
      )
    : addDays(new Date(), TWO_WEEKS)

  const maxDate = addYears(minDate, 1)
  const excludeDates = getWeekendDays(minDate, maxDate)

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um skiptafund</Text>
      </GridColumn>

      <GridColumn span="6/12">
        <InputController
          required={required}
          name={RecallApplicationInputFields.DIVISION_MEETING_LOCATION}
          label="Staðsetning skiptafundar"
          onBlur={(location) => updateDivisionMeetingLocation(location)}
        />
      </GridColumn>
      <GridColumn span="6/12">
        <DatePickerController
          required={required}
          withTime={true}
          name={RecallApplicationInputFields.DIVISION_MEETING_DATE}
          label="Dagsetning skiptafundar"
          minDate={minDate ? getNextWeekday(minDate) : undefined}
          maxDate={maxDate}
          excludeDates={excludeDates}
          onChange={(date) => updateDivisionMeetingDate(date.toISOString())}
        />
      </GridColumn>
    </GridRow>
  )
}
