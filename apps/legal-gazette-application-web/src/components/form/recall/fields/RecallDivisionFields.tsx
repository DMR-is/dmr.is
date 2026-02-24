import { addDays, addMonths, addYears } from 'date-fns'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette-schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { ONE_WEEK } from '../../../../lib/constants'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

type Props = {
  isBankruptcy: boolean
}

export const RecallDivisionFields = ({ isBankruptcy }: Props) => {
  const { getValues, watch } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
    id: applicationId,
    type: 'RECALL',
  })

  const recallDates = watch('publishingDates') || []

  const twoMonthsAndOneWeek = addDays(
    addMonths(new Date(recallDates[0]), 2),
    ONE_WEEK,
  )
  const minDate = recallDates.length
    ? getNextValidPublishingDate(twoMonthsAndOneWeek)
    : getNextValidPublishingDate()
  const maxDate = getNextValidPublishingDate(addYears(minDate, 5))
  const excludeDates = getInvalidPublishingDatesInRange(minDate, maxDate)

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="6/12">
        <InputController
          required={isBankruptcy}
          name="fields.divisionMeetingFields.meetingLocation"
          label="Staðsetning skiptafundar"
          onChange={(location) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
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
        {recallDates.length === 0 ? (
          <AlertMessage type="info" title="Veldu birtingardag fyrst" />
        ) : (
          <DatePickerController
            required={isBankruptcy}
            withTime={true}
            name="fields.divisionMeetingFields.meetingDate"
            label="Dagsetning skiptafundar"
            minDate={minDate}
            maxDate={maxDate}
            excludeDates={excludeDates}
            onChange={(date) =>
              // Save to localStorage only - server sync happens on navigation
              updateLocalOnly({
                fields: {
                  divisionMeetingFields: {
                    meetingDate: date.toISOString(),
                  },
                },
              })
            }
          />
        )}
      </GridColumn>
    </GridRow>
  )
}
