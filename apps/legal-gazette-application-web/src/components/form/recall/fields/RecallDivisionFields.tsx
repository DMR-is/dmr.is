import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { ONE_WEEK, TWO_WEEKS } from '../../../../lib/constants'
import { getNextWeekday, getWeekendDays } from '../../../../lib/utils'
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
  } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateApplicationJson } = useUpdateApplicationJson({
    id: applicationId,
    type: 'RECALL',
  })

  const recallDates = watch('publishingDates') || []

  useEffect(() => {
    if (isReady && dirtyFields.publishingDates) {
      setValue('publishingDates', [])

      updateApplicationJson({
        fields: {
          divisionMeetingFields: {
            meetingDate: null,
          },
        },
      })
    }
  }, [recallDates, isReady, dirtyFields])

  const minDate = recallDates?.length
    ? addDays(new Date(recallDates[recallDates.length - 1]), ONE_WEEK * 9)
    : addDays(new Date(), TWO_WEEKS)

  const maxDate = addYears(minDate, 1)
  const excludeDates = getWeekendDays(minDate, maxDate)

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h4">Upplýsingar um skiptafund</Text>
      </GridColumn>

      <GridColumn span="6/12">
        <InputController
          required={required}
          name="fields.divisionMeetingFields.meetingLocation"
          label="Staðsetning skiptafundar"
          onBlur={(location) =>
            updateApplicationJson({
              fields: {
                divisionMeetingFields: {
                  meetingLocation: location,
                },
              },
            })
          }
        />
      </GridColumn>
      <GridColumn span="6/12">
        <DatePickerController
          required={required}
          withTime={true}
          name="fields.divisionMeetingFields.meetingDate"
          label="Dagsetning skiptafundar"
          minDate={minDate ? getNextWeekday(minDate) : undefined}
          maxDate={maxDate}
          excludeDates={excludeDates}
          onChange={(date) =>
            updateApplicationJson({
              fields: {
                divisionMeetingFields: {
                  meetingDate: date.toISOString(),
                },
              },
            })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
