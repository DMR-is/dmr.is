import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { TWO_WEEKS } from '../../../../../lib/constants'
import {
  RecallFormFields,
  RecallFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
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
  } = useFormContext<RecallFormSchema>()
  const { applicationId } = getValues('meta')

  const recallDates = watch(RecallFormFields.PUBLISHING_DATES)

  useEffect(() => {
    if (isReady && dirtyFields?.fields?.publishingDates) {
      setValue(
        RecallFormFields.DIVISION_MEETING_DATE,
        undefined as unknown as Date,
      )
      trigger({
        divisionMeetingDate: undefined,
      })
    }
  }, [recallDates, isReady, dirtyFields])

  const { trigger } = useUpdateApplication({
    applicationId,
  })

  const minDate = recallDates?.length
    ? addDays(new Date(recallDates[recallDates.length - 1]), TWO_WEEKS)
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
          name={RecallFormFields.DIVISION_MEETING_LOCATION}
          label="Staðsetning skiptafundar"
          onBlur={(location) => trigger({ divisionMeetingLocation: location })}
        />
      </GridColumn>
      <GridColumn span="6/12">
        <DatePickerController
          required={required}
          withTime={true}
          name={RecallFormFields.DIVISION_MEETING_DATE}
          label="Dagsetning skiptafundar"
          minDate={minDate ? getNextWeekday(minDate) : undefined}
          maxDate={maxDate}
          excludeDates={excludeDates}
          onChange={(date) =>
            trigger({ divisionMeetingDate: date.toISOString() })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
