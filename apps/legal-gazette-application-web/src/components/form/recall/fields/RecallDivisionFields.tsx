import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { ONE_WEEK, TWO_WEEKS } from '../../../../lib/constants'
import { getNextWeekday, getWeekendDays } from '../../../../lib/utils'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

type Props = {
  isBankruptcy: boolean
}

export const RecallDivisionFields = ({ isBankruptcy }: Props) => {
  const {
    getValues,
    setValue,
    watch,
    formState: { isReady, dirtyFields },
  } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateApplication, debouncedUpdateApplication } =
    useUpdateApplication({
      id: applicationId,
      type: 'RECALL',
    })

  const recallDates = watch('publishingDates') || []

  useEffect(() => {
    if (isReady && dirtyFields.publishingDates) {
      setValue('publishingDates', [])

      updateApplication({
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
          required={isBankruptcy}
          name="fields.divisionMeetingFields.meetingLocation"
          label="Staðsetning skiptafundar"
          onChange={(location) =>
            debouncedUpdateApplication(
              {
                fields: {
                  divisionMeetingFields: {
                    meetingLocation: location,
                  },
                },
              },
              {
                successMessage: 'Staðsetning skiptafundar vistuð',
                errorMessage: 'Ekki tókst að vista staðsetningu skiptafundar',
              },
            )
          }
        />
      </GridColumn>
      <GridColumn span="6/12">
        <DatePickerController
          required={isBankruptcy}
          withTime={true}
          name="fields.divisionMeetingFields.meetingDate"
          label="Dagsetning skiptafundar"
          minDate={minDate ? getNextWeekday(minDate) : undefined}
          maxDate={maxDate}
          excludeDates={excludeDates}
          onChange={(date) =>
            debouncedUpdateApplication(
              {
                fields: {
                  divisionMeetingFields: {
                    meetingDate: date.toISOString(),
                  },
                },
              },
              {
                successMessage: 'Dagsetning skiptafundar vistuð',
                errorMessage: 'Ekki tókst að vista dagsetningu skiptafundar',
              },
            )
          }
        />
      </GridColumn>
    </GridRow>
  )
}
